var $window = $(window);

$("body").fadeIn("fast");

function getWidth() {
    $("body").css({
        height: $window.height(),
        width: $window.width()
    });
}

function go() {
    let cards = $("#cards");
    cards.empty();

    $.post("/api/data", function(resp) {
        const data = resp.data;
        data.forEach(item => {
            cards.append(`
                    <div class="cards_container">
                        <div class="card-iot">
                            <div class="bg-img">
                                <div class="overlay"></div>
                                <div class="inner">
                                    <h1>${item.name}</h1>
                                    <small class="info">
                                        <span class="temperature">${item.temperature} <i class="fas fa-temperature-low"></i></span> 
                                        <span class="humidity">${item.humidity} <i class="fas fa-tint"></i></span>
                                    </small>
                                </div>
                            </div>
                        </div>
                        <a href="/place" class="button-place"><i class="fas fa-plus"></i></a>
                    </div>
                `);
        });

        $("#cards").owlCarousel({
            loop: false,
            items: 1,
            margin: 10,
            nav: false
        });

        (function($) {
            $.fn.clickToggle = function(func1, func2) {
                // var funcs = [func1, func2];
                // this.data('toggleclicked', 0);
                // this.click(function() {
                //     var data = $(this).data();
                //     var tc = data.toggleclicked;
                //     $.proxy(funcs[tc], this)();
                //     data.toggleclicked = (tc + 1) % 2;
                // });
                return this;
            };
        })(jQuery);

        $(".card-iot").each(function(index) {
            var that = $(this);
            var b = that.find(".bg-img");
            b.css({
                "background-image": `url('${data[index].img}')`
            });
            var o = that.find(".overlay");

            var r = that.find(".info .right");
            var l = that.find(".info .left");
            var tl = new TimelineMax();

            var tween1 = TweenMax.to(that, 0.35, {
                height: 600,
                margin: 0,
                width: "100%",
                background: "#fff",
                borderRadius: 0,
                ease: Expo.easeInOut,
                y: 0
            });
            var tween2 = TweenMax.to(b, 0.35, {
                borderRadius: 0,
                ease: Expo.easeInOut,
                y: 0
            });
            var tween3 = TweenMax.to(o, 0.35, {
                borderRadius: 0,
                ease: Expo.easeInOut,
                y: 0
            });

            var tween4 = TweenMax.to(r, 0.35, {
                width: "100%",
                height: "100px",
                ease: Expo.easeInOut
            });
            var tween5 = TweenMax.to(l, 0.35, {
                width: "100%",
                height: "100px",
                ease: Expo.easeInOut
            });

            tween1.pause();
            tween2.pause();
            tween3.pause();
            tween4.pause();
            tween5.pause();

            $(that).clickToggle(
                function() {
                    tween1.play();
                    tween2.play();
                    tween3.play();
                    tween4.play();
                    tween5.play();
                },
                function() {
                    tween1.reverse();
                    tween2.reverse();
                    tween3.reverse();
                    TweenMax.to(r, 0.35, {
                        width: "30%",
                        height: "132px",
                        ease: Expo.easeInOut
                    });
                    TweenMax.to(l, 0.35, {
                        width: "70%",
                        height: "132px",
                        ease: Expo.easeInOut
                    });
                }
            );
        });

        $("body").on("swipe", function() {
            $(".card").click(false);
            tween1.reverse();
            tween2.reverse();
            tween3.reverse();
        });
    });

    let messageId = 0;

    $("#place-form").submit(function(e) {
        e.preventDefault();

        const data = {
            name: $('#place-form input[name="name"]').val(),
            code: $('#place-form input[name="code"]').val(),
            img: $('#place-form input[name="img"]').val(),
            secret: $('#place-form input[name="secret"]').val()
        };

        $.post("/place", data)
            .done(function(resp) {
                $('#place-form input[name="name"]').val("");
                $('#place-form input[name="code"]').val("");
                $('#place-form input[name="img"]').val("");
                $('#place-form input[name="secret"]').val("");
                messageId++;
                $(
                    `<span id="message-${messageId}" class="badge badge-success message" >${resp.message}</span>`
                )
                    .insertAfter(".sensor-title")
                    .hide()
                    .show("slow", function() {
                        setTimeout(() => {
                            $(`#message-${messageId}`).hide("slow", function() {
                                $(`#message-${messageId}`).remove();
                            });
                        }, 2000);
                    });
            })
            .fail(function(err) {
                messageId++;
                $(
                    `<span id="message-${messageId}" class="badge badge-danger message" >${err.responseJSON.message}</span>`
                )
                    .insertAfter(".sensor-title")
                    .hide()
                    .show("slow", function() {
                        setTimeout(() => {
                            $(`#message-${messageId}`).hide("slow", function() {
                                $(`#message-${messageId}`).remove();
                            });
                        }, 2000);
                    });
                //
            });
    });
}

go();
getWidth();
$window.resize(getWidth);
