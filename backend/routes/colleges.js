const express = require('express');
const router = express.Router();
const { getAllColleges, getCollegeById, predictColleges } = require('../controllers/colleges');

router.get('/', getAllColleges);
router.get('/predict', predictColleges);
router.get('/:id', getCollegeById);

module.exports = router;