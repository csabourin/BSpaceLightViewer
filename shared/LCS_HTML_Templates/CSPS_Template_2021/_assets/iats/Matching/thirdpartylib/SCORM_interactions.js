function SCORMSession(id) {
   this.id = Date.now();
   this.activityID = id;
   this.interactions = 0;
}

function SCORMInteraction(session) {
   this.stopwatch = null;
   this.timer = 0;
   this.latency = '';

   this.eventID = pipwerks.SCORM.data.get('cmi.interactions._count');
   this.activityID = session.activityID;
   this.orgID = window.top.location.href.split('/')[6];
   this.sessionID = session.id;
   this.sessionEventID = session.interactions;

   session.interactions++;

   this.interactionID = this.activityID + '_' + this.orgID + '_' + this.sessionID + '_' + this.sessionEventID;
   this.cmiString = 'cmi.interactions.' + this.eventID + '.';

   this.post = function(response, result) {
      this.stopTimer();
      pipwerks.SCORM.data.set(this.cmiString + 'id', this.interactionID);
      pipwerks.SCORM.data.set(this.cmiString + 'latency', this.latency);
      pipwerks.SCORM.data.set(this.cmiString + 'timestamp', new Date().toISOString());
      pipwerks.SCORM.data.set(this.cmiString + 'learner_response', response);
      pipwerks.SCORM.data.set(this.cmiString + 'result', result);
   }

   this.startTimer = function() {
      this.latency = 0;
      this.timer = 0;

      var targ = this;

      this.stopwatch = setInterval(function() {
         targ.timer++;
      }, 1000);
   }

   this.stopTimer = function() {
      clearInterval(this.stopwatch);

      this.latency = 'PT' + this.timer + 'S';
   }

   this.startTimer();
}