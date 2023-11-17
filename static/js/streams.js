const APP_ID = 'd75afdcb3e064317835ca39c4ebe7d97';
const CHANNEL = sessionStorage.getItem('room');
const TOKEN = sessionStorage.getItem('token');
let UID = Number(sessionStorage.getItem('uid'));


let NAME = sessionStorage.getItem('name');

let localTracks = [];
let remoteUsers = {};

const client = AgoraRTC.createClient({
	mode: 'rtc',
	codec: 'vp8',
});

let joinAndDisplayLocalStream = async () => {
	document.getElementById('room-name').innerText = CHANNEL;

	client.on('user-published', handleUserJoined);
	client.on('user-left', handleUserLeft);

	try {
		await client.join(APP_ID, CHANNEL, TOKEN, UID);
	} catch(err) {
		console.error(err);
		window.open('/', '_self')
	}

	localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

	let member = await createMember();

	let player = `<div class='video-container' id='user-container-${UID}'>
									<div class='username-wrapper'><span class='user-name'>${member.name}</span></div>
									<div class='video-player' id='user-${UID}'></div>
								</div>`;

	let htmlObject = document.createElement('div');
	htmlObject.innerHTML = player;

	document.getElementById('video-streams').insertAdjacentElement('beforeend', htmlObject.firstChild);
	localTracks[1].play(`user-${UID}`);

	await client.publish([ localTracks[0], localTracks[1] ]);
}

let handleUserJoined = async (user, mediaType) => {
	remoteUsers[user.uid] = user;
	await client.subscribe(user, mediaType);

	if(mediaType == 'video') {
		let player = document.getElementById(`user-container-${user.uid}`);
		if(player !== null) {
			player.remove();
		}

		let member = await getMember(user);

		player = `<div class='video-container' id='user-container-${user.uid}'>
								<div class='username-wrapper'><span class='user-name'>${member.name}</span></div>
								<div class='video-player' id='user-${user.uid}'></div>
							</div>`;

		let htmlObject = document.createElement('div');
		htmlObject.innerHTML = player;

		document.getElementById('video-streams').insertAdjacentElement('beforeend', htmlObject.firstChild);
		user.videoTrack.play(`user-${user.uid}`);
	}

	if(mediaType == 'audio') {
		user.audioTrack.play();
	}

}

let handleUserLeft = async (user) => {
	delete remoteUsers[user.uid];
	deleteMember();
	document.getElementById(`user-container-${user.uid}`).remove();
}

let leaveAndRemoveLocalTracks = async () => {
	for(let i = 0; i < localTracks.length; i++) {
		localTracks[i].stop();
		localTracks[i].close();
	}

	await client.leave();
	deleteMember();
	window.open('/', '_self');
}

let toggleCamera = async (e) => {
	if(localTracks[1].muted) {
		await localTracks[1].setMuted(false);
		e.target.style.backgroundColor = '#ffe4c4';
	} else {
		await localTracks[1].setMuted(true);
		e.target.style.backgroundColor = '#f88';
	}
}

let toggleAudio = async (e) => {
	if(localTracks[0].muted) {
		await localTracks[0].setMuted(false);
		e.target.style.backgroundColor = '#ffe4c4';
	} else {
		await localTracks[0].setMuted(true);
		e.target.style.backgroundColor = '#f88';
	}
}

let createMember = async () => {
	let response = await fetch('/create_member/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ 'name': NAME, 'room_name': CHANNEL, 'uid': UID }),
	});

	let member = await response.json();
	return member;
}

let getMember = async (user) => {
	let response = await fetch(`/get_member/?uid=${user.uid}&room_name=${CHANNEL}`);
	let member = await response.json();
	return member;
}

let deleteMember = async () => {
	let response = await fetch('/delete_member/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ 'name': NAME, 'room_name': CHANNEL, 'uid': UID }),
	});

	let member = await response.json();
}

joinAndDisplayLocalStream();

window.addEventListener('beforeunload', deleteMember);

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalTracks);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleAudio);