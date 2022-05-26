const comment = {
    "comment": "you're strong",
    "userId": 46904628,
    "target": 0,
    "name": "victorjason_65852",
    "userLevel": 5.019,
    "profileUrlString": "victorjason_65852",
    "role": 5,
    "paid": true,
    "subscriptionType": 0,
    "broadcasterMod": true,
    "optedToGuest": false,
    "textStyle": 3,
    "propsLevel": 100,
    "isAmbassador": false,
    "timestamp": 1650133445,
    "broadcasterId": 48832442,
    "broadcastId": "213384926",
    "isPrivate": 0,
    "broadcasterTierRank": 4,
    "globalSpenderRank": 0,
    "subscriptionData": {
        "badgesAssetRevision": 129,
        "badgeAssetSku": "BADGE_1_6"
    },
    "type": "comment"
};



class EventEmitter {
    listeners = [];

    emit(eventName, data) {
        this.listeners
            .filter(({name}) => name === eventName)
            .forEach(({callback}) => setTimeout(callback.apply(this, [this, ...data]), 0));1
    }

    on(name, callback) {
        if(typeof callback === 'function' && typeof name === 'string') {
            this.listeners.push({name, callback});
        }
    }

    off(eventName, callback) {
        this.listeners = this.listeners.filter(
            listener => !(listener.name === eventName && listener.callback === callback)
        );
    }
    destroy() {
        this.listener.length = 0;
    }

}

export class MessageParser extends EventEmitter {
    types = Object.freeze({
        COMMENT: 'comment'
    })
    processMessage(msg) {
        if (msg.type === 'comment') {
            const {
                comment,
                userId,
                name
            } = msg;
            this.emit(this.types.COMMENT, {comment,userId, name})
        }
    }

    /**
     *
     * @param {({comment: string, userId: number, name: string}) => null} cb
     */
    onComment(cb) {
        this.on(this.types.COMMENT, cb);
    }
}