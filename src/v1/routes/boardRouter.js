const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const boardLikeController = require('../controllers/boardLikeController');
const boardCommentController = require('../controllers/boardCommentController');

/* BOARD */
router.get('/', boardController.getBoardList)
router.get('/:boardId', boardController.getBoardDetail)
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