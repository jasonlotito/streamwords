distributeData = () => {};

function watchChat(username, cb) {
    // return connectToWebsockets(username, cb).then((e)=> console.log(e));
    return new Promise(resolve => {

        const profileUrl = `/api/younow/userid.php?username=${username}`;
        let broadcasterId = 0;

        fetch(profileUrl).then(data => data.json()).then(d => {
            broadcasterId = d;
            console.log(broadcasterId);
            connectToWebsockets(broadcasterId, cb);
        });
    })
}

function watchChatById(userId, cb) {
    connectToWebsockets(userId, cb)
}

function connectToWebsockets(userId, cb)
{
    distributeData = cb;
    return new Promise (resolve =>
    {
        //First Startup Connection:
        console.log ('Connected');

        let pusher = new Pusher ('d5b7447226fc2cd78dbb', {
            cluster: "younow"
        });

        let channel = pusher.subscribe ("public-channel_" + userId);

        //Get BroadcastsData
        channel.bind ('onBroadcastPlayData', function (data)
        {
            let obj = data.message;
            obj.type = 'playData';
            distributeData (obj);

            //This is for connecting to stream on the mainPage:
            if (typeof streamConnected !== 'undefined')
            {
                if (streamInitiatorObj.readyForStream)
                {
                    streamConnected ();
                }
            }
        });

        //Get SuperChat
        channel.bind ('onSuperMessage', function (data)
        {
            handleOnSuperMessage (data);
        });

        //Get Chat
        channel.bind ('onChat', function (data)
        {
            handleOnChat (data);
        });

        //Get Gifts
        channel.bind ('onGift', function (data)
        {
            handleOnGift (data);
        });

        //Get Stickers
        channel.bind ('onSticker', function (data)
        {
            handleNewSticker (data);
        });

        //Get Stickers
        channel.bind ('onPartnerSticker', function (data)
        {
            handleOnOldPartnerSticker (data);
        });

        channel.bind ('onBroadcastEnd', function (data)
        {
            let obj = data.message;
            obj.type = 'onBroadcastEnd';
            distributeData (obj);
        });

        resolve ();
    });
}

async function startApiFetching()
{
    setInterval (function ()
    {
        fetchApi (accountHandlerObj.userName).then (async (data) =>
        {
            if (!data.hasOwnProperty ('tags'))
                return;

            // in case of another running instance we end this fetch loop
            if (duplicateInstanceDetection && duplicateInstanceDetection.hasOtherInstance)
                return;

            handleApiData (data);
        }).catch (error =>
        {
            toastr.warning (error, 'ERROR', {timeOut: 8000});
            console.log (error);
        });
    }, 8000);
}


// Handle Data -----------------------

function handleOnChat(data)
{
    if (handleNoData (data)) return;

    for (let i = 0; i < data.message.comments.length; i++)
    {
        //We split chat into comment, invite, capture and becoming a fan (afterwards also fake fan, invite and moment)
        let obj = data.message.comments[i];

        if (obj.textStyle === 1 && (
            obj.comment.includes ('has raided the broadcast with') ||
            obj.comment.includes ("Zuschauer in deinen Broadcast gesendet!" ||
                obj.comment.includes ("مشاهد إلى") ||
                obj.comment.includes ("Raid") ||
                obj.comment.includes ("izleyiciyle yayını bastı")
            )))
        {
            //Raider found in obj.name
            obj.raidAmount = obj.comment.match (/(\d+)(?!.*\d)/)[0];
            obj.type = 'raid';
        } else if (obj.comment.includes ("I became a fan!") ||
            obj.comment.includes ("Ich bin Fan geworden!") ||
            obj.comment.includes ("Me he convertido en fan.") ||
            obj.comment.includes ("أصبحت معجب"))
        {
            if (!dataDownloaderObj.newFans.includes (obj.name))
            {
                dataDownloaderObj.newFans.push (obj.name);
                obj.type = 'fan';
            } else
            {
                obj.type = 'fakeFan'
            }

        } else if (obj.comment.includes ("captured a moment of"))
        {
            obj.type = 'moment';
        } else if (obj.comment.includes ("invited") && obj.comment.includes ("fans to this broadcast.") ||
            (obj.comment.includes ("hat") && obj.comment.includes ("zu diesem Broadcast eingeladen.")) ||
            obj.comment.includes ("he invitado a") && obj.comment.includes ("fans a esta transmisión.") ||
            obj.comment.includes ("معجب لهذا البث"))
        {
            if (obj.comment.indexOf (" ") === 0)
            {
                obj.type = 'invite';
            } else
            {
                obj.type = 'fakeInvite';
            }
        } else
        {
            //We don't push the comment if it's a "Bot message"
            if (isBotCommand (obj.comment))
                return;

            obj.type = 'comment';

        }
        distributeData (obj);
    }
}


function handleOnGift(data)
{
    if (handleNoData (data)) return;

    for (let i = 0; i < data.message.stageGifts.length; i++)
    {
        let obj = data.message.stageGifts[i];

        switch (obj.giftId)
        {
            case 880:
                obj.type = 'resub'
                break;
            case 897:
                obj.type = 'giftedSub'
                break;
            case 42:
                obj.type = 'tipJar'
                break;
            case 63:
                obj.type = 'sub'
                break;
            default:
                obj.type = 'gift';
        }

        distributeData (obj);
    }
}

function handleOnOldPartnerSticker(data)
{
    if (handleNoData (data)) return;

    for (let i = 0; i < data.message.stageGifts.length; i++)
    {
        let obj = data.message.stageGifts[i];
        obj.type = 'partnerSticker';
        distributeData (obj);
    }
}

function handleNewSticker(data)
{
    if (handleNoData (data)) return;

    for (let i = 0; i < data.message.stickers.length; i++)
    {
        let obj = data.message.stickers[i];

        if (obj.assetSku.includes ('STICKER_TIER'))
        {
            obj.type = 'partnerSticker';
        } else
        {
            obj.type = 'sticker';
        }

        distributeData (obj);
    }
}

function handleOnSuperMessage(data)
{
    if (handleNoData (data)) return;

    //Create inputs for Tools
    for (let i = 0; i < data.message.superMessages.length; i++)
    {
        let obj = data.message.superMessages[i];
        obj.type = 'superMessage';
        distributeData (obj);
    }
}

function handleApiData(data)
{
    if (data.hasOwnProperty ("silentFromChatUsers"))
    {
        if (numberArrayStringToArray (data.silentFromChatUsers).length > dataDownloaderObj.silencedUserCount)
        {
            distributeData ({type: 'new Silence'});
            dataDownloaderObj.silencedUserCount = numberArrayStringToArray (data.silentFromChatUsers).length;
        }

        let silentUsersObj = {};
        silentUsersObj.message = numberArrayStringToArray (data.silentFromChatUsers);
        silentUsersObj.type = 'silencedFromChat';
        distributeData (silentUsersObj);
    }

    if (data.hasOwnProperty ("watchingBroadcastMods"))
    {
        let watchingBroadcastModsObj = {};
        watchingBroadcastModsObj.message = data.watchingBroadcastMods;
        watchingBroadcastModsObj.type = 'watchingBroadcastMods';
        distributeData (watchingBroadcastModsObj);
    }

    distributeData ({
        message: parseInt (data.broadcastId),
        type: 'broadcastId'
    });

    //StreamTitle
    distributeData ({
        message: data.shareMsg,
        type: 'streamTitle'
    });
    //Is editors of choice
    distributeData ({
        message: (data.isEditorsChoice !== ''),
        type: 'isEditorsChoice'
    });
    //Hashtag
    distributeData ({
        message: (data.tags[0]),
        type: 'hashTag'
    });
    //Total guest sessions
    distributeData ({
        message: (data.hasOwnProperty ('totalGuestSessions') ? parseInt (data.totalGuestSessions) : 0),
        type: 'totalGuestSessions'
    });
    //Total silenced users
    distributeData ({
        message: (data.hasOwnProperty ('silentFromChatUsers') ?
            numberArrayStringToArray (data.silentFromChatUsers).length : 0),
        type: 'totalUsersSilenced'
    });

    distributeData ({
        message: (data.hasOwnProperty ('viewers') ? parseInt (data.viewers) : 0),
        type: 'viewerCount'
    });

    distributeData ({
        message: parseInt (data.dateStarted),
        type: 'firstTimeStamp'
    });

    distributeData ({
        message: parseInt (data.serverTime),
        type: 'timeStamp'
    });

    distributeData ({
        message: parseInt (data.numMomentsCreated),
        type: 'numMomentsCreated'
    });

    distributeData ({
        message: parseInt (data.shares),
        type: 'shares'
    });

    distributeData ({
        message: parseInt (data.likes),
        type: 'likes'
    });

    distributeData ({
        message: parseInt (data.fans),
        type: 'newFansInt'
    });

    distributeData ({
        message: parseInt (data.broadcastsCount),
        type: 'broadcastsCount'
    });
}

async function handleTrendingData()
{
    distributeTrending ().then (async () =>
    {
        await sleep (30000)
        handleTrendingData ();
    });
}

function distributeTrending()
{
    return new Promise (resolve =>
    {
        let topTrendingObj = {};
        getTopTrending (accountHandlerObj.userLocalization).then (result =>
        {
            topTrendingObj.message = result.trending_users;
            topTrendingObj.type = 'topTrending';
            distributeData (topTrendingObj);
            resolve ();
        })
    })
}

//Data Helper Functions
function handleNoData(data)
{
    if (!data.message)
    {
        console.log ('Error missing WebSocket Data');
        return true;
    }
    return false;
}

function isBotCommand(input)
{
    return input === 'is watching' ||
        input === 'Hello, I\'m new here!' ||
        input === 'Hey, there!' ||
        (/^Hey there .*!$/).test (input) ||
        (/^Welcome to your first broadcast, .*!$/).test (input) ||
        (/^👋👋👋👋 .*$/).test (input) ||
        (/^Welcome .*🤩$/).test (input) ||
        (/^Hi .*, how are you\?$/).test (input) ||
        (/^Welcome to the broadcast .*$/).test (input) ||
        (/^Hi .*!$/).test (input);
}

