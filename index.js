var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/HAIRSALONBOOKING';
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('can not connect to server');
  } else {
    console.log('connect successful!!');
    collection = db.collection('Users');
    bannerCollection = db.collection('Banner');
    lookbookCollection = db.collection('LookBook');
    salonCollection = db.collection('AllSalon');
    branchCollection = db.collection('Branch');
    barberCollection = db.collection('Barber');
    booktimeCollection = db.collection('Booktime');
    shoppingCollection = db.collection('Shopping');
    notificationCollection = db.collection('Notification');
    tokenCollection = db.collection('Tokens');
    serviceCollection = db.collection('Services');
    ratingCollection = db.collection('Rating');
    adminCollection = db.collection('Admin');
  }
});
http.listen(3000, function () {
  console.log('Listening on port 3000');
});
io.on('connection', function (socket) {
  socket.on('login', function (email, password) {
    console.log("EventLogin: " + email + " va password: " + password);
    var cursor = collection.find({ email: email });
    cursor.each(function (err, doc) {
      if (err) {
        console.log(err);
      } else {
        if (doc != null) {
          if (doc.password == password) {
            let getUser = JSON.parse(JSON.stringify(doc));
            console.log(getUser);
            socket.emit('login', getUser);
          }
        }
      }
    });
  });
  socket.on('register', function (email, name, phone, adress) {
    let user = { email: email, name: name, phone: phone, adress: adress };
    collection.insert(user, function (err, result) {
      console.log(result);
      if (err) {
        throw err;
      } else {
        socket.emit('register', user);
        console.log('insert success!')
      }
    });

  });

  socket.on('getBanners', function () {
    const cursor = bannerCollection.find({});
    cursor.each(function (err, data) {
      if (data != null) {
        console.log(data);
        socket.emit('getBanners', data);
      }
    });

  });

  socket.on('getLookBook', function () {
    const cursor = lookbookCollection.find({});
    cursor.each(function (err, data) {
      if (data != null) {
        console.log(data);
        socket.emit('getLookBook', data);
      }
    });

  });

  socket.on('getAllSalon', function () {
    const cursor = salonCollection.find({});
    cursor.each(function (err, data) {
      if (data != null) {
        console.log(data);
        socket.emit('getAllSalon', data);
      }
    });

  });
  socket.on('getBranch', function (name) {
    const cursor = branchCollection.find({ namesalon: name });
    cursor.each(function (err, data) {
      if (data != null) {
        console.log(data);
        socket.emit('getBranch', data);
      } else {
        // console.log(err);
      }
    });
  });

  socket.on('getBarbers', function (idBranch) {
    const cursor = barberCollection.find({ idBranch: idBranch });
    cursor.each(function (err, data) {
      if (data != null) {
        console.log(data);
        socket.emit('getBarbers', data);
      } else {
        // console.log(err);
      }
    });
  });

  socket.on('getTimeBooking', function (id, time) {
    const cursor = booktimeCollection.find({ $and: [{ barberId: id }, { date: time }] }).sort({ slot: 1 });
    cursor.forEach(function (data) {

      console.log(data);
      io.emit('getTimeBooking', data);

    });
  });


  socket.on('addBooking', (barberId, barberName, customerName, customerPhone, salonId, salonAddress, salonName, slot, done, date, notification, cartItemList) => {
    let cartItemListJson = JSON.parse(cartItemList);
    let bookingInfo = {
      barberId: barberId,
      barberName: barberName,
      customerName: customerName,
      customerPhone: customerPhone,
      salonId: salonId,
      salonAddress: salonAddress,
      salonName: salonName,
      slot: slot,
      done: done,
      date: date,
      cartItemListJson
    }
    booktimeCollection.insert(bookingInfo, function (err, result) {
      if (err) {
        console.log(err);
        throw err;
      } else {
        socket.emit('addBooking', result);
        console.log('addbooking' + result)
        let myNotification = JSON.parse(notification);
        notificationCollection.insert(myNotification, function (err, resultnotification) {
          if (err) {
            console.log(err);
          } else {
            console.log(resultnotification);
          }
        })
        notificationCollection.find({ $and: [{ idBarber: barberId }, { read: false }] }).count(function (err, count) {
          if (err) {
            console.log(err)
          } else {
            io.emit('countNotification', count)
            console.log(count)
          }
        });
      }
    });


  });
  socket.on('countNotification', (idBarber) => {
    notificationCollection.find({ $and: [{ idBarber: idBarber }, { read: false }] }).count(function (err, count) {
      if (err) {
        console.log(err)
      } else {
        socket.emit('countNotification', count)
        console.log(count)
      }
    });
  })

  socket.on('getNotification', (idBarber) => {
    notificationCollection.find({ $and: [{ idBarber: idBarber }, { read: false }] }).each(function (err, data) {
      if (err) {
        throw err;
        console.log(err)
      } else {
        socket.emit('getNotification', data)
        notificationCollection.updateMany({idBarber: idBarber }, { $set: { read: true }}, function(err, data){
          if(err){
            throw err;
          }else{
            console.log("update notification", data)
          }
        })
      }
    });
  })

  socket.on('checkemail', function (email,phone) {
    console.log(email, phone);
    collection.findOne({$or:[{email: email },{phone:phone}]} , function (err, result) {
      if (result != null) {
        console.log(result);
        socket.emit('checkemail', result);
      
        
      } else {
        socket.emit('checkemail', result);
        console.log('show dialog client for update infomation');
      }
    });
  });
  socket.on('getItemShopping', function (type) {
    const cursor = shoppingCollection.find({ type: type });
    cursor.each(function (err, data) {
      console.log(data)
      socket.emit('getItemShopping', data);
    });
  });

  socket.on('staffLogin', function (idBranch, userName, password) {
    barberCollection.findOne({ $and: [{ idBranch: idBranch }, { username: userName }, { password: password }] }, function (err, isMatch) {
      if (err) {

      } else {
        console.log('staffLogin' + isMatch);
        socket.emit('staffLogin', isMatch);
      }
    });
  });
  socket.on('updateToken', token => {
    let jsontoken = JSON.parse(token);
    console.log(jsontoken);
    if (jsontoken.idbarber != null) {
      console.log(jsontoken.idbarber);
      tokenCollection.update({ idbarber: jsontoken.idbarber }, { idbarber: jsontoken.idbarber, token: jsontoken.token }, { upsert: true })
    }
    else if (jsontoken.phoneCustomer != null) {
      console.log(jsontoken.phoneCustomer);
      tokenCollection.update({ customerPhone: jsontoken.phoneCustomer }, { customerPhone: jsontoken.phoneCustomer, token: jsontoken.token }, { upsert: true })
    }
  });
  socket.on('getToken', function (keytoken) {
    tokenCollection.findOne({ $or: [{ idbarber: keytoken }, { customerPhone: keytoken }] }, function (err, data) {
      if (err) {
        throw err;
      }
      socket.emit('getToken', data);
      console.log('gettoken' + data)
    });
  });
  socket.on('getBookInfomation', (idBookTime, customerPhone) => {
    if (idBookTime == null) {
      let cursor = booktimeCollection.find({ $and:[{done: false},{customerPhone:customerPhone}] }).sort({ _id: -1 }).limit(1);
      cursor.forEach(function (data) {
        socket.emit('getBookInfomation', data);
        console.log('GET BOOKING INFOMATION' + data)

      });
    } else {
      booktimeCollection.findOne({ _id: ObjectId(idBookTime) }, function (err, data) {
        if (err) {
          throw err;
        } else {
          socket.emit('getBookInfomation', data);
          console.log('GET BOOKING INFOMATION' + data)
        }
      })
    }
  });
  socket.on('getBookingHistory',customerPhone =>{
    booktimeCollection.find({ $and:[{done: true},{customerPhone:customerPhone}] }).sort({_id:-1}).forEach(data=>{
      console.log('getBookingHistory ',data)
      socket.emit('getBookingHistory',data)
    })
  })
  socket.on('getServices', function () {
    serviceCollection.find({}).each(function (err, data) {
      if (err) {
        throw err;
      } else {
        socket.emit('getServices', data);
        console.log(data)
      }
    });
  })
  socket.on('doneService', (idBookTime) => {
    booktimeCollection.update({ _id: ObjectId(idBookTime) }, { $set: { done: true } }, function (err, data) {
      if (err) throw err
      else {
        let cursor = booktimeCollection.find({ slot: false }).sort({ _id: -1 }).limit(1);
        cursor.each(function (err, data) {
          if (err) throw err;
          else {
            io.emit('getBookInfomation', data);
            console.log('getBookInfomation' + data)
          }
        });
        socket.emit('doneService', data.result);
        console.log(data.result)
      }
    });
  })
  socket.on('Rating',(numberRating,commend, idBarber)=>{
    if(numberRating!=null && commend!=null){
      ratingCollection.insert({rate:numberRating,commend:commend, idBarber:idBarber},function(err,result){
        if(result){
          ratingCollection.aggregate([{$match:{idBarber:idBarber}},{$group:{_id:{},sum: {$sum: "$rate"}}}]).each(function(err,data){
            if(data!=null){
              ratingCollection.find({idBarber:idBarber}).count(function(err,number){
                if(err){
                  throw err
                }else{
                  let ratingpercent = parseFloat((data.sum/number).toFixed(1)); 
                  barberCollection.update({_id:ObjectId(idBarber)},{$set:{rating:ratingpercent}},{upsert:true},function(err,data){
                    if(err){
                      throw err;
                    }else{
                      console.log(data);
                    }
                  })
                }
              })
            }
          })
        }
      });

    }
  })
  socket.on('adminLogin', function(userName, password){
      adminCollection.findOne({$and:[{userName:userName},{password:password}]},function(err,data){
        console.log('admin login', data)
        socket.emit('adminLogin',data)
      })
    })

    //Admin
  socket.on('addState', nameState=>{
    salonCollection.insert({name:nameState},function(err,result){
      if(err){
        throw err;
      }else{
        console.log('add state', result.ops[0])
        socket.emit('addState', result.ops[0])
      }
    })
  })
  socket.on('deleteState', nameState=>{
    salonCollection.remove({name:nameState},function(err, data){
      if(data!=null){
        console.log('delete state', data)
        socket.emit('deleteState', data);
      }
    })
  })
  socket.on('updateState',(preState, nameState)=>{
    salonCollection.update({name:preState},{$set:{name:nameState}},function(err,data){
      if(err){
        throw err;
      }else{
        console.log('updateState', data)
        socket.emit('updateState', data)
      }
    })
  })
});