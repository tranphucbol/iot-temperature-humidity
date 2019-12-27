CREATE TABLE place (
	id INT NOT NULL auto_increment,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    img VARCHAR(255),
    PRIMARY KEY (id)	
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE temp_humi_log (
	id INT NOT NULL auto_increment,
    placeId INT NOT NULL,
    temperature FLOAT NOT NULL,
	humidity FLOAT NOT NULL,
    logTime TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
	FOREIGN KEY (placeId) REFERENCES place(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO place (name, code, img) VALUES 
    ('Long Thành', 'lt', 'https://images.unsplash.com/photo-1444418185997-1145401101e0?format=auto&auto=compress&dpr=2&crop=entropy&fit=crop&w=1355&h=858&q=80'),
    ('Hồ Chí Minh', 'hcm', 'https://images.unsplash.com/photo-1431620828042-54af7f3a9e28?format=auto&auto=compress&dpr=2&crop=entropy&fit=crop&w=1102&h=740&q=80')