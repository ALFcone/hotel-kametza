const fs = require('fs');
// Let's try sharp if it's there
try {
  const sharp = require('sharp');
  sharp('../public/logoo.png')
    .resize(10, 10)
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += info.channels) {
        r += data[i];
        g += data[i+1];
        b += data[i+2];
      }
      const count = data.length / info.channels;
      console.log(`Average Color (Sharp): #${Math.round(r/count).toString(16).padStart(2,'0')}${Math.round(g/count).toString(16).padStart(2,'0')}${Math.round(b/count).toString(16).padStart(2,'0')}`);
      
      const idx = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * info.channels;
      console.log(`Center Color (Sharp): #${data[idx].toString(16).padStart(2,'0')}${data[idx+1].toString(16).padStart(2,'0')}${data[idx+2].toString(16).padStart(2,'0')}`);
    }).catch(e => console.log("Sharp error:", e.message));
} catch(e) {
  console.log("Sharp not available.");
}
