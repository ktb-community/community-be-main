const express = require('express');
const upload = require("../middlewares/multer");
const jwtAuthenticate = require("../middlewares/jwtAuthenticate");

const router = express.Router();
const boardController = require('../controllers/boardController');
const boardLikeController = require('../controllers/boardLikeController');
const boardCommentController = require('../controllers/boardCommentController');

/* BOARD */
router.get('/', boardController.getBoardList);
router.post('/', jwtAuthenticate, upload.single("boardImg"), boardController.addBoard);
router.get('/:boardId', jwtAuthenticate, boardController.getBoardDetail);
router.put('/:boardId', jwtAuthenticate, upload.single("boardImg"), boardController.modifyBoard);
router.delete('/:boardId', jwtAuthenticate, boardController.deleteBoard);
router.post('/:boardId/views', jwtAuthenticate, boardController.countBoardView);

/* BOARD_LIKE */
router.get('/:boardId/likes', jwtAuthenticate, boardLikeController.checkBoardLike);
router.post('/:boardId/likes', jwtAuthenticate, boardLikeController.toggleBoardLike);

/* BOARD_COMMENT */
router.get('/:boardId/comments', jwtAuthenticate, boardCommentController.getBoardComments);
router.post('/:boardId/comments', jwtAuthenticate, boardCommentController.addBoardComment);
router.patch('/:boardId/comments', jwtAuthenticate, boardCommentController.modifyBoardComment);
router.delete('/:boardId/comments', jwtAuthenticate, boardCommentController.deleteBoardComment);

module.exports = router;