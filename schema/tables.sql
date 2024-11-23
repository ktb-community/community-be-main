USE community;

DROP TABLE IF EXISTS BOARD_COMMENT;
DROP TABLE IF EXISTS BOARD;
DROP TABLE IF EXISTS USERS;

CREATE TABLE IF NOT EXISTS USERS (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    nickname VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(512) NOT NULL,
    profileImg VARCHAR(255),
    refreshToken VARCHAR(255),
    role VARCHAR(255) NOT NULL DEFAULT 'USER',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastLoginDate DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BOARD (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    boardImg VARCHAR(512),
    views INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    writerId INT NOT NULL,
    FOREIGN KEY (writerId) REFERENCES USERS(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BOARD_LIKE (
    id INT PRIMARY KEY AUTO_INCREMENT,
    boardId INT NOT NULL,
    likerId INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (boardId) REFERENCES BOARD(id) ON DELETE CASCADE,
    FOREIGN KEY (likerId) REFERENCES USERS(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS BOARD_COMMENT (
    id INT PRIMARY KEY AUTO_INCREMENT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    boardId INT NOT NULL,
    writerId INT,
    FOREIGN KEY (boardId) REFERENCES BOARD(id) ON DELETE CASCADE,
    FOREIGN KEY (writerId) REFERENCES USERS(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE USER 'luis'@'%' IDENTIFIED BY '1111';
-- GRANT ALL PRIVILEGES ON community.* TO 'luis'@'%';
DROP PROCEDURE IF EXISTS generate_dummy_data;

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS generate_dummy_data()
BEGIN
    DECLARE user_idx INT;
    DECLARE board_idx INT;
    DECLARE comment_idx INT;
    DECLARE comment_count INT;

    -- 사용자 100명 생성
    SET user_idx = 1;
    WHILE user_idx <= 100 DO
        INSERT INTO USERS (email, nickname, password, profileImg, role)
        VALUES (
            CONCAT('user', user_idx, '@example.com'),
            CONCAT('nickname', user_idx),
            'password123ASD@',
            CONCAT('profile', user_idx, '.jpg'),
            'USER'
        );
        SET user_idx = user_idx + 1;
    END WHILE;

    -- 각 사용자마다 10개의 게시글 생성
    SET user_idx = 1;
    WHILE user_idx <= 100 DO
        SET board_idx = 1;
        WHILE board_idx <= 10 DO
            INSERT INTO BOARD (title, content, boardImg, writerId)
            VALUES (
                CONCAT('Title for user ', user_idx, ' - post ', board_idx),
                CONCAT('This is the content of post ', board_idx, ' by user ', user_idx, '.'),
                CONCAT('boardImg', board_idx, '.jpg'),
                user_idx
            );
            SET board_idx = board_idx + 1;
        END WHILE;
        SET user_idx = user_idx + 1;
    END WHILE;

    -- 각 게시글마다 50~100개의 댓글 생성
    SET board_idx = 1;
    WHILE board_idx <= 1000 DO  -- 100명의 유저 * 10개의 게시글
        SET comment_count = FLOOR(50 + (RAND() * 51));  -- 50 ~ 100개의 댓글 수 결정
        SET comment_idx = 1;
        WHILE comment_idx <= comment_count DO
            INSERT INTO BOARD_COMMENT (boardId, writerId)
            VALUES (
                board_idx,
                IF(RAND() < 0.8, FLOOR(1 + (RAND() * 100)), NULL)  -- 80% 확률로 작성자 지정, 20%는 NULL
            );
            SET comment_idx = comment_idx + 1;
        END WHILE;
        SET board_idx = board_idx + 1;
    END WHILE;
END //

DELIMITER ;

-- 프로시저 호출
CALL generate_dummy_data();

SELECT * FROM USERS;
SELECT * FROM BOARD;
SELECT * FROM BOARD_COMMENT;
SELECT * FROM BOARD_LIKE;