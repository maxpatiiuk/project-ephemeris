SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS `calendar`
(
    `id`          int(11)      NOT NULL AUTO_INCREMENT,
    `name`        varchar(256) NOT NULL,
    `description` text,
    `color`       varchar(7)   NOT NULL COMMENT 'Like #ffffff',
    PRIMARY KEY (`id`),
    UNIQUE KEY `calendar_id_uindex` (`id`)
) ENGINE = MyISAM
  DEFAULT CHARSET = latin1
  AUTO_INCREMENT = 11;

CREATE TABLE IF NOT EXISTS `event`
(
    `id`               int(11)    NOT NULL AUTO_INCREMENT,
    `startDate`        date       NOT NULL,
    `endDate`          date       NOT NULL,
    `defaultStartTime` time       NOT NULL,
    `defaultEndTime`   time       NOT NULL,
    `daysOfWeek`       varchar(7) NOT NULL,
    `defaultColor`     varchar(7) NOT NULL,
    `calendarId`       int(11)    NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `event_id_uindex` (`id`),
    KEY `calendarId` (`calendarId`)
) ENGINE = MyISAM
  DEFAULT CHARSET = latin1
  AUTO_INCREMENT = 20;

CREATE TABLE IF NOT EXISTS `eventOccurrence`
(
    `id`            int(11)      NOT NULL AUTO_INCREMENT,
    `name`          varchar(256) NOT NULL,
    `description`   text,
    `startDateTime` datetime     NOT NULL,
    `endDateTime`   datetime     NOT NULL,
    `color`         varchar(7)   NOT NULL,
    `eventId`       int(11)      NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `eventOccurrence_id_uindex` (`id`),
    KEY `eventId` (`eventId`)
) ENGINE = MyISAM
  DEFAULT CHARSET = latin1 COMMENT ='A single occurrence of a repeated event'
  AUTO_INCREMENT = 129;
