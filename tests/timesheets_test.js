QUnit.test( "EventListener", function(assert) {

  var responder = {
    messages: [],
    template: function(label) {
      message = [label];
      for (var i = 1; i < arguments.length; i++) {
        message.push(arguments[i]);
      }
      this.messages.push(message);
    },
    clearMessages: function() {
      this.messages = [];
    }
  };

  var storage = {
    data: {},

    init: function(initData) {
      this.data = _.clone(initData || {});
    },

    get: function(username, date) {
      if(!this.data[username]) this.data[username] = {};
      var dateStr = String(DateUtils.toDate(date));
      var row = this.data[username][dateStr];
      return row || { user: username };
    },

    set: function(username, date, params) {
      var row = this.get(username, date);
      row.user = username;
      _.extend(row, _.pick(params, 'signIn', 'signOut', 'note'));
      this.data[username][String(DateUtils.toDate(date))] = row;
      return row;
    },

    getUsers: function() {
      return _.keys(this.data);
    },

    getByDate: function(date) {
      dateStr = String(DateUtils.toDate(date));
      return _.compact(_.map(this.data, function(row) {
        return row[dateStr];
      }));
    }
  };

  var settings = {
    values: {},
    get: function(key) {
      return this.values[key];
    },
    set: function(key, val) {
      return this.values[key] = val;
    }
  };


  var msgTest = function(user, msg, result) {
    responder.clearMessages();
    timesheets.receiveMessage(user, msg);
    assert.ok(_.isEqual(result, responder.messages), user+":"+msg);
  };

  var storageTest = function(initData, callback) {
    callback(function(user, msg, result) {
      storage.init(initData);
      msgTest(user, msg, result);
    });
  };


  var timesheets = new Timesheets(storage, settings, responder);

  DateUtils.now(new Date(2014,0,2,12,34,0));
  var nowDateStr = String(new Date(2014,0,2));

  // 出勤
  storageTest({}, function(msgTest) {
    msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
    msgTest('test1', 'おはよう 4:56', [['出勤', 'test1', "2014/01/02 04:56"]]);
    msgTest('test1', 'おはよう 4:56 2/3', [['出勤', 'test1', "2014/02/03 04:56"]]);
  });

  // 出勤時間の変更
  var test1 = {};
  test1[nowDateStr] = { user: 'test1', signIn: new Date(2014,0,2,0,0,0) };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'おはよう', []);
    msgTest('test1', 'おはよう 4:56', [['出勤更新', 'test1', "2014/01/02 04:56"]]);
  });

  // 退勤
  storageTest({}, function(msgTest) {
    msgTest('test1', 'おつ', [['退勤', 'test1', "2014/01/02 12:34"]]);
    msgTest('test1', 'お疲れさま 14:56', [['退勤', 'test1', "2014/01/02 14:56"]]);
    msgTest('test1', 'お疲れさま 16:23 12/3', [['退勤', 'test1', "2013/12/03 16:23"]]);
  });

  // 退勤時間の変更
  var test1 = {};
  test1[nowDateStr] = { user: 'test1', signIn: new Date(2014,0,2,0,0,0), signOut: new Date(2014,0,2,12,0,0) };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'おつ', []);
    msgTest('test1', 'お疲れさま 14:56', [['退勤更新', 'test1', "2014/01/02 14:56"]]);
  });

  // 退勤時間の変更
  var test1 = {};
  test1[nowDateStr] = { user: 'test1', signIn: new Date(2014,0,2,0,0,0), signOut: new Date(2014,0,2,12,0,0) };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'おつ', []);
    msgTest('test1', 'お疲れさま 14:56', [['退勤更新', 'test1', "2014/01/02 14:56"]]);
  });

  // 休暇申請
  storageTest({}, function(msgTest) {
    msgTest('test1', 'お休み', []);
    msgTest('test1', '今日はお休み', [['休暇', 'test1', "2014/01/02"]]);
    msgTest('test1', '明日はお休み', [['休暇', 'test1', "2014/01/03"]]);
    msgTest('test1', '12/3はお休みでした', [['休暇', 'test1', "2013/12/03"]]);
  });

  // 休暇取消
  var test1 = {};
  test1[nowDateStr] = { user: 'test1', signIn: '-', singOut: '-' };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', 'お休みしません', []);
    msgTest('test1', '今日はお休みしません', [['休暇取消', 'test1', "2014/01/02"]]);
    msgTest('test1', '明日はお休みしません', [['休暇取消', 'test1', "2014/01/03"]]);
  });


  // 出勤確認
  storageTest({}, function(msgTest) {
    msgTest('test1', '誰がいる？', [['出勤なし']]);
  });

  // 出勤確認
  var test1 = {};
  test1[nowDateStr] = { user: 'test1', signIn: DateUtils.now() };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', '誰がいる？', [['出勤中', 'test1']]);
  });

  // 出勤確認
  var test1 = {}, test2 = {};
  test1[nowDateStr] = { user: 'test1', signIn: DateUtils.now() };
  test2[nowDateStr] = { user: 'test2', signIn: DateUtils.now() };
  storageTest({'test1': test1, 'test2':test2}, function(msgTest) {
    msgTest('test1', '誰がいる？', [['出勤中', 'test1, test2']]);
  });

  // 出勤確認
  var test1 = {}, test2 = {};
  test1[nowDateStr] = { user: 'test1', signIn: DateUtils.now(), signOut: DateUtils.now() };
  test2[nowDateStr] = { user: 'test2', signIn: DateUtils.now() };
  storageTest({'test1': test1, 'test2':test2}, function(msgTest) {
    msgTest('test1', '誰がいる？', [['出勤中', 'test2']]);
  });

  // 出勤確認
  var test1 = {}, test2 = {};
  test1[nowDateStr] = { user: 'test1', signIn: DateUtils.now(), signOut: DateUtils.now() };
  test2[nowDateStr] = { user: 'test2', signIn: '-' };
  storageTest({'test1': test1, 'test2':test2}, function(msgTest) {
    msgTest('test1', '誰がいる？', [['出勤なし']]);
  });

  // 休暇確認
  storageTest({}, function(msgTest) {
    msgTest('test1', '誰がお休み？', [['休暇なし', '2014/01/02']]);
  });

  // 出勤確認
  var test1 = {};
  test1[nowDateStr] = { user: 'test1', signIn: '-' };
  storageTest({'test1': test1}, function(msgTest) {
    msgTest('test1', '誰がお休み？', [['休暇中', '2014/01/02', 'test1']]);
  });

  // 出勤確認
  var test1 = {}, test2 = {};
  test1[nowDateStr] = { user: 'test1', signIn: '-' };
  test2[nowDateStr] = { user: 'test2', signIn: '-' };
  storageTest({'test1': test1, 'test2':test2}, function(msgTest) {
    msgTest('test1', '誰がお休み？', [['休暇中', '2014/01/02', 'test1, test2']]);
  });

  // 出勤確認
  var test1 = {}, test2 = {};
  test1[nowDateStr] = { user: 'test1', signIn: undefined };
  test2[nowDateStr] = { user: 'test2', signIn: '-' };
  storageTest({'test1': test1, 'test2':test2}, function(msgTest) {
    msgTest('test1', '誰がお休み？', [['休暇中', '2014/01/02', 'test2']]);
  });

  // 出勤確認
  var test1 = {}, test2 = {};
  test1[nowDateStr] = { user: 'test1', signIn: DateUtils.now(), signOut: DateUtils.now() };
  test2[nowDateStr] = { user: 'test2', signIn: undefined };
  storageTest({'test1': test1, 'test2':test2}, function(msgTest) {
    msgTest('test1', '誰がお休み？', [['休暇なし', '2014/01/02']]);
  });
});