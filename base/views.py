from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
import random
import time
import json
from .models import RoomMember
from django.views.decorators.csrf import csrf_exempt


def getToken(request):
    appId = 'd75afdcb3e064317835ca39c4ebe7d97'
    appCertificate = '7de5abda4a4e487da7efcd03f62c4934'
    channelName = request.GET.get('channel')
    uid = random.randint(1, 230)
    role = 1
    expirationTimeInSeconds = 3600 * 24
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds

    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({ 'token': token, 'uid': uid }, safe = False)

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')

@csrf_exempt
def createMember(request):
    data = json.loads(request.body)

    member, created = RoomMember.objects.get_or_create(
        name = data['name'],
        uid = data['uid'],
        room_name = data['room_name']
    )

    return JsonResponse({ 'name': data['name'] }, safe = False)

def getMember(request):
    uid = request.GET.get('uid')
    room_name = request.GET.get('room_name')

    member = RoomMember.objects.get(
        uid = uid,
        room_name = room_name
    )

    name = member.name
    return JsonResponse({ 'name': member.name }, safe = False)

@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)

    member, created = RoomMember.objects.get_or_create(
        name = data['name'],
        uid = data['uid'],
        room_name = data['room_name']
    )
    member.delete()
    return JsonResponse('Member was deleted', safe = False)
