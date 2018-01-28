const express = require('express');
const router = express.Router();

const asyncHandler = require('../utils/async-handler-middleware');

router.get('/:barcode', asyncHandler(async (req, res) => {
    const asset = await req.ambrosusHelper.getAssetByIdentifier('barcode', req.params.barcode);
    if (asset == null) {
        res.type('json').status(404).send();
        return;
    }

    const events = await req.ambrosusHelper.getEventsForAsset(asset.id);
    asset['events'] = events;
    res.type('json').status(200).send(asset);
}));

module.exports = router; 