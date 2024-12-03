const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

router.get('/', boardController.getBoardList)
router.get('/:boardId', boardController.getBoardDetail)
router.post('/:boardId/views', boardController.countBoardView);

module.exports = router;