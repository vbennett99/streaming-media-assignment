const fs = require('fs');
const path = require('path');

function writeResponseHead(response, start, end, total, chunksize, contentType) {
  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': contentType,
  });
}

const createStream = (response, file, start, end) => {
  const stream = fs.createReadStream(file, { start, end });
  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });
  return stream;
};

const getBytePositions = (request) => {
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  return range.replace(/bytes=/, '').split('-');
};

function loadFile(request, response, filePath, contentType) {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const positions = getBytePositions(request);

    let start = parseInt(positions[0], 10);
    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    const chunksize = (end - start) + 1;

    writeResponseHead(response, start, end, total, chunksize, contentType);

    const stream = createStream(response, file, start, end);
    return stream;
  });
}

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
