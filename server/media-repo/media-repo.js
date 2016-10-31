/*
  Media Repository server handler

  Using the Kurento repository server for now. We could swap it for a different implementation.
  This handler needs to provide methods to:
  - create an item (i.e. return a url for a recording)
  - return an item url (from an id parameter) for listening
  - delete an item (from an id parameter)
  - update an item metadata (from an id parameter)
  - return all items matching provided metadata parameters (username...), ideally with regex support for the values
    NOTE: not sure if we want the matching to use an OR or an AND function, the Kurento repository seems to use an OR function

*/

'use strict';

var debug = require('debug');
//debug.enable('media-repo:*');
var log = debug('media-repo:log');
var info = debug('media-repo:info');
var error = debug('media-repo:error');

const Promise = require('bluebird');
const request = require('request');

// Kurento repository URI
const KRP_URI = process.env.KRP_URI || 'http://radradio.stream:7676';

const reqGetOptions = id => {
  return {
    url: `${KRP_URI}/repo/item/${id}`,
    method: 'GET',
    json: {}
  };
};

const reqDeleteOptions = id => {
  return {
    url: `${KRP_URI}/repo/item/${id}`,
    method: 'DELETE',
    json: {}
  };
};

const reqPutOptions = (id, metadata) => {
  return {
    url: `${KRP_URI}/repo/item/${id}/metadata`,
    method: 'PUT',
    json: metadata
  };
};

const reqPostOptions = metadata => {
  return {
    url: `${KRP_URI}/repo/item`,
    method: 'POST',
    json: metadata
  };
};

const reqFindOptions = metadata => {
  return {
    url: `${KRP_URI}/repo/item/find/regex`,
    method: 'POST',
    json: metadata
  };
};

const mediaRepoRequest = options => {
  return new Promise((resolve, reject) => {
    request(options, (err, resp, body) => {
      if (err) {
        error('Bad Kurento request');
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
};

const checkMetadata = metadata => {
  return new Promise((resolve, reject) => {
    (metadata.id || metadata.url) ? reject('Metadata cannot contain id/url keys') : resolve(true);
  });
};

module.exports = {

  createItem: metadata => {
    let options = reqPostOptions(metadata);
    return checkMetadata(metadata).then(() => mediaRepoRequest(options)).then(data => data).catch(error);
  },

  updateItem: (id, metadata) => {
    let options = reqPutOptions(id, metadata);
    return checkMetadata(metadata).then(() => mediaRepoRequest(options)).then(data => data).catch(error); // no response
  },

  deleteItem: id => {
    let options = reqDeleteOptions(id);
    return mediaRepoRequest(options).then().catch(error); // no response
  },

  getItem: id => {
    // fetch url first
    let options = reqGetOptions(id);
    return mediaRepoRequest(options).then(data => {
      // fetch metadata next
      options = reqGetOptions(id + '/metadata');
      return mediaRepoRequest(options).then(metadata => {
        return Object.assign({}, data, metadata); // returns object with id/url/metadata
      });
    }).catch(error);
  },

  findItems: metadata => {
    let options = reqFindOptions(metadata);
    return mediaRepoRequest(options).then(data => data).catch(error);
  }

};
