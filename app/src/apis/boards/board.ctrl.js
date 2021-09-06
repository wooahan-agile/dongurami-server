'use strict';

const Board = require('../../models/services/Board/Board');
const Comment = require('../../models/services/Board/Comment/Comment');
const Image = require('../../models/services/Image/Image');

const process = {
  findAllByCategoryNum: async (req, res) => {
    const board = new Board(req);
    const response = await board.findAllByCategoryNum();

    if (response.success) return res.status(200).json(response);
    if (response.isError) return res.status(500).json(response.clientMsg);
    return res.status(400).json(response);
  },

  findOneByBoardNum: async (req, res) => {
    const board = new Board(req);
    const comment = new Comment(req);
    const image = new Image(req);
    const response = await board.findOneByBoardNum();

    if (response.success) {
      const updateBoardHit = await board.updateOnlyHitByNum();
      response.images = await image.findAllByBoardImg();
      response.comments = await comment.findAllByBoardNum();

      if (response.comments.isError)
        return res.status(500).json(response.clientMsg);

      if (response.images.isError)
        return res.status(500).json(response.clientMsg);

      if (updateBoardHit.isError)
        return res.status(500).json(updateBoardHit.clientMsg);

      if (response.success) {
        response.board[0].hit += 1;
        return res.status(200).json(response);
      }
    }
    if (response.isError) return res.status(500).json(response.clientMsg);
    return res.status(400).json(response);
  },
};

module.exports = process;
