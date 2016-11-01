const express = require('express');
const mediaRepo = require('../media-repo/media-repo');

module.exports = function(app) {

  // create new recording item with metadata, get back recording endpoint url
  app.post('/api/recording', (req, res) =>
    mediaRepo.createItem(req.body)
      .then(data => 
        res.status(200).json(data))
      .catch(err => 
        res.status(500).json(err))
  );

  // get recording url and metadata from id
  app.get('/api/recording/:id', (req, res) =>
    mediaRepo.getItem(req.params.id)
      .then(data => 
        res.status(200).json(data))
      .catch(err => 
        res.status(500).json(err))
  );

  // delete recording from id
  app.delete('/api/recording/:id', (req, res) =>
    mediaRepo.deleteItem(req.params.id)
      .then(data => 
        res.status(200))
      .catch(err => 
        res.status(500).json(err))
  );

  // update recording metadata from id
  app.put('/api/recording/:id', (req, res) =>
    mediaRepo.updateItem(req.params.id, req.body)
    .then(data => 
      res.status(200))
    .catch(err => 
      res.status(500).json(err))
  );

  // get list of recordings (returns list of recording IDs)
  app.post('/api/recordings', (req, res) =>
    mediaRepo.findItems(req.body)
    .then(data => 
      res.status(200).json(data))
    .catch(err => 
      res.status(500).json(err))
  );

};