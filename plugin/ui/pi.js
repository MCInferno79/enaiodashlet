let socket, context;
function send(command) { if(socket?.readyState === 1) socket.send(JSON.stringify({ action:'de.heki.autoprofile.control', event:'sendToPlugin', context, payload:{command} })); }
window.connectElgatoStreamDeckSocket = (port, uuid, registerEvent, _info, actionInfo) => {
  context = JSON.parse(actionInfo).context;
  socket = new WebSocket('ws://127.0.0.1:' + port);
  socket.onopen = () => { socket.send(JSON.stringify({event:registerEvent,uuid})); send('status'); };
  socket.onmessage = e => {
    let msg; try { msg=JSON.parse(e.data); } catch { return; }
    if(msg.event !== 'sendToPropertyInspector') return;
    const p=msg.payload;
    if(p.pairingCode) { document.querySelector('#code').value=p.pairingCode; document.querySelector('#state').textContent='Code erzeugt – zwei Minuten gültig.'; }
    else document.querySelector('#state').textContent=p.error || (p.paused?'Pausiert':'Bereit') + '\nGeräte: ' + (p.devices||[]).map(d=>d.name+' ('+d.size.columns+'×'+d.size.rows+', Typ '+d.type+')').join(', ')+'\nEingebundene Profile: '+(p.profiles||[]).map(p=>p.label).join(', ');
  };
};
document.querySelector('#pair').onclick=()=>send('pair');
document.querySelector('#status').onclick=()=>send('status');
