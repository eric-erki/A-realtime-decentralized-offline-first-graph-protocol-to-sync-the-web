var Gun = (typeof window !== "undefined")? window.Gun : require('../gun');

Gun.on('create', function(root){
	this.to.next(root);
	var opt = root.opt;
	if(typeof window !== "undefined"){
		return; // do nothing for now - Chrome extensions could use multicast though
	}
	if(false === opt.multicast){ return }

  var MULTICAST_ADDR = "233.255.255.255";
  var PORT = 20000;
  var ENC = 'utf8';

  var dgram = require("dgram");
  var process = require("process");

  socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  socket.bind(PORT);

  var address;
  socket.on("listening", function() {
    socket.addMembership(MULTICAST_ADDR);
    setInterval(sendMessage, 1000);
    address = socket.address();
    /*
    console.log(
      `UDP socket listening on ${address.address}:${address.port} pid: ${
        process.pid
      }`
    );
    */
  });

  function sendMessage() {
    var msgObj = {
      gun: {
        version: Gun.version,
        port: 8765 // TODO: get actual port instead of default 8765
      }
    };
    var message = Buffer.from(JSON.stringify(msgObj), ENC);
    socket.send(message, 0, message.length, PORT, MULTICAST_ADDR, function() {
      // console.info(`Sending message "${message}"`);
    });
  }

  socket.on("message", function(message, rinfo) {
    var msgObj = JSON.parse(message.toString(ENC));
    if (!(msgObj.gun && msgObj.gun.port)) { return }
    var peer = `http://${rinfo.address}:${msgObj.gun.port}`;
    if (!root.opt.peers.hasOwnProperty(peer)) {
      console.log(`peer ${peer} found via multicast`);
      root.$.opt({peers: [peer]});
    }
  });
});