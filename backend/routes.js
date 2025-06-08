const express = require('express');
const router = express.Router();
const routeController = require('./controllers/routeController');

router.post('/init-route', routeController.getInitialData);
router.post('/update-route', routeController.updateRoute);

module.exports = router;
