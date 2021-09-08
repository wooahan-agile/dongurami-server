'use strict';

const Schedule = require('../../models/services/Schedule/Schedule');

const process = {
  findAllByClubNum: async (req, res) => {
    const schedule = new Schedule(req);
    const response = await schedule.findAllByClubNum();

    if (response.success) {
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.errMsg);
    }

    return res.status(400).json(response);
  },

  createSchedule: async (req, res) => {
    const schedule = new Schedule(req);
    const response = await schedule.createSchedule();

    if (response.success) {
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.clientMsg);
    }

    return res.status(500).json(response);
  },

  updateSchedule: async (req, res) => {
    // 일정 내용과 시간과 관련하여 수정 시
    const schedule = new Schedule(req);
    const response = await schedule.updateSchedule();

    if (response.success) {
      console.log(response);
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.clinetMsg);
    }

    return res.status(500).json(response);
  },

  updateImportant: async (req, res) => {
    // 일정 중요도 수정
    const schedule = new Schedule(req);
    const response = await schedule.updateImportant();

    if (response.success) {
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.cleintMsg);
    }

    return res.status(500).json(response);
  },

  deleteSchedule: async (req, res) => {
    const schedule = new Schedule(req);
    const response = await schedule.deleteSchedule();

    if (response.success) {
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.clientMsg);
    }

    return res.status(500).json(response);
  },
};

module.exports = {
  process,
};
