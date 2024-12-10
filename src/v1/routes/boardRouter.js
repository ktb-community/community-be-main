const express = require('express');
const upload = require("../../middlewares/multer");

const router = express.Router();
const boardController = require('../controllers/boardController');
const boardLikeController = require('../controllers/boardLikeController');
const boardCommentController = require('../controllers/boardCommentController');

/* BOARD */
router.get('/', boardController.getBoardList);
router.post('/', upload.single("boardImg"), boardController.addBoard);
router.get('/:boardId', boardController.getBoardDetail);
router.put('/:boardId', upload.single("boardImg"), boardController.modifyBoard);
router.delete('/:boardId', boardController.deleteBoard);
router.post('/:boardId/views', boardController.countBoardView);

/* BOARD_LIKE */
router.get('/:boardId/likes/:userId', boardLikeController.checkBoardLike);
router.post('/:boardId/likes/:userId', boardLikeController.toggleBoardLike);

/* BOARD_COMMENT */
router.get('/:boardId/comments', boardCommentController.getBoardComments);
router.post('/:boardId/comments', boardCommentController.addBoardComment);
router.patch('/:boardId/comments', boardCommentController.modifyBoardComment);
router.delete('/:boardId/comments', boardCommentController.deleteBoardComment);

module.exports = router;