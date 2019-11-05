var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongodb = require('mongodb');

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

    console.log('có người đăng ký tài khoản');
    collection.findOne({ email: email }, function (err, result) {
      if (result != null) {
        socket.emit('register', 'Exits');
        console.log('Tồn Tại');
      } else {
        let user = { email: email, name: name, phone: phone, adress: adress };
        collection.insert(user, function (err, result) {
          console.log(result);
          if (err) {
            socket.emit('register', 'Err');
            throw err;
          } else {
            socket.emit('register', 'Success');
            console.log('insert success!')

          }
        });
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
    const cursor = booktimeCollection.find({$and:[{ barberId: id}, {date: time }]});
    cursor.each(function (err, data) {
      if (cursor.hasNext()) {
        console.log(data);
        socket.emit('getTimeBooking', data);
      } else {
         console.log(err);
      }
    });
  });


  socket.on('addBooking', (barberId,barberName,customerName,customerPhone,salonId,salonAddress, salonName,slot,date,notification)=> {
    let bookingInfo = {
      barberId: barberId,
      barberName: barberName,
      customerName: customerName,
      customerPhone:customerPhone,
      salonId:salonId,
      salonAddress:salonAddress, 
      salonName:salonName,
      slot:slot,
      date:date}
     let myNotification = JSON.parse(notification);
      notificationCollection.insert(myNotification,function(err,result){
        if(err){
          console.log(err);
        }else{
          console.log(result);
        }
      })
      booktimeCollection.insert(bookingInfo, function(err,result){
        if(err){
          console.log(err);
          throw err;
        }else{
          const cursor = notificationCollection.find({$and:[{ idBarber: barberId}, {read: false }]});
          cursor.each(function (err, data) {
            io.emit('getUnreadNotification',data)
            console.log(data);
        });
          socket.emit('addBooking',result);
          console.log(result);
        }
      });
  });
  socket.on('getUnreadNotification',(idBarber)=>{
    const cursor = notificationCollection.find({$and:[{ idBarber: idBarber}, {read: false }]});
    cursor.each(function (err, data) {
        console.log(data);
        socket.emit('getUnreadNotification', data);

    });
    
  })

  socket.on('checkemail', function (email) {
    console.log(email);
    collection.findOne({ email: email }, function (err, result) {
      if (result != null) {
        console.log(result);
        socket.emit('checkemail', result);
      } else {
        socket.emit('checkemail', result);
        console.log('show dialog client for update infomation');
      }
    });
  });
  socket.on('getItemShopping', function(type){
    const cursor = shoppingCollection.find({type:type});
    cursor.each(function(err,data){
      console.log(data)
      socket.emit('getItemShopping',data);
    });
  });

  socket.on('staffLogin', function(idBranch, userName,password){
   barberCollection.findOne({$and:[{idBranch:idBranch},{username:userName}, {password: password}]},function(err,isMatch){
     if(err){
       
     }else{
      console.log(isMatch);
      socket.emit('staffLogin',isMatch);
     }
   });

    
  });


//   shoppingCollection.insertMany([
//     //Wax
// {type:'WAX',
//   name : 'Wax Colonna Hair Mud',
// image : 'https://product.hstatic.net/1000306701/product/sap-colona-30shine1_master.jpg',
// price : 25},

// {type:'WAX',
//   name : 'Wax Colonna Hair Mud',
// image : 'https://product.hstatic.net/1000306701/product/sap-colona-30shine1_master.jpg',
// price : 25},

// {type:'WAX',
//   name : 'Wax By Vilain Dynamite Clay',
// image : 'https://product.hstatic.net/1000306701/product/42_master.jpg',
// price : 25},

// {type:'WAX',
//   name : 'Wax By Vilain Gold Digger',
// image : 'https://product.hstatic.net/1000306701/product/goldigger_master.jpg',
// price : 25},
// {type:'WAX',
//   name : 'Wax Glanzen Clay',
// image : 'https://product.hstatic.net/1000306701/product/glazen_tag_master.jpg',
// price : 25},

// {type:'WAX',
//   name : 'Wax Kevin Murphy - Rough Rider',
// image : 'https://product.hstatic.net/1000306701/product/5_95461894759842e3839bf71fa8b3be7b_master.jpg',
// price : 30},

// {type:'WAX',
//   name : 'Wax Morris Motley',
// image : 'https://product.hstatic.net/1000306701/product/6_8c53296c9e584436bb61f079515d3930_master.jpg',
// price : 40},

// {type:'WAX',
//   name : 'Wax Morris Motley Balm',
// image : 'https://product.hstatic.net/1000306701/product/1_9c57f1e58cda4d94b6681df8f67cfdea_master.jpg',
// price : 40},

// //Spray
// {type:'SPRAY',
//   name : 'BRITISH M Hard Tailor Spray ',
// image : 'https://product.hstatic.net/1000306701/product/g_m00_master.jpg',
// price : 30},

// {type:'SPRAY',
//   name : 'Colonna Spray',
// image : 'https://product.hstatic.net/1000306701/product/p1411484_master.jpg',
// price : 20
// },
// {type:'SPRAY',
//   name : 'Spray Lady Killer',
// image : 'https://product.hstatic.net/1000306701/product/9_master.jpg',
// price : 30},

// {type:'SPRAY',
//   name : 'Spray R&B',
// price : 'https://product.hstatic.net/1000306701/product/10_87d53831c1594e1584ca0f1fd791d46d_master.jpg',
// price : 10},

// {type:'SPRAY',
//   name : 'Spray TIGI RK Groupie Hard Hold',
// image : 'https://product.hstatic.net/1000306701/product/groupie_master.jpg',
// price : 15},

// {type:'SPRAY',
//   name : 'Spray TIGI BED HEAD HARD HEAD',
// image : 'https://product.hstatic.net/1000306701/product/bed_head_c0e8619915fa4ddea2f44bc550fec7f4_master.jpg',
// price : 25},
//   ]);

});