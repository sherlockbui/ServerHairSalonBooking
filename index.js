var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongodb = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

var MongoClient = mongodb.MongoClient;
var url = "mongodb://localhost:27017/HAIRSALONBOOKING";
MongoClient.connect(url, function(err, db) {
  if (err) {
    console.log("can not connect to server");
  } else {
    console.log("connect successful!!");
    collection = db.collection("Users");
    bannerCollection = db.collection("Banner");
    lookbookCollection = db.collection("LookBook");
    salonCollection = db.collection("AllSalon");
    branchCollection = db.collection("Branch");
    barberCollection = db.collection("Barber");
    booktimeCollection = db.collection("Booktime");
    shoppingCollection = db.collection("Shopping");
    notificationCollection = db.collection("Notification");
    tokenCollection = db.collection("Tokens");
    serviceCollection = db.collection("Services");
    ratingCollection = db.collection("Rating");
    adminCollection = db.collection("Admin");
  }
});
http.listen(3000, function() {
  console.log("Listening on port 3000");
});
io.on("connection", function(socket) {
  socket.on("login", function(email, password) {
    console.log("EventLogin: " + email + " va password: " + password);
    var cursor = collection.find({ email: email });
    cursor.each(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        if (doc != null) {
          if (doc.password == password) {
            let getUser = JSON.parse(JSON.stringify(doc));
            console.log(getUser);
            socket.emit("login", getUser);
          }
        }
      }
    });
  });
  socket.on("register", function(email, name, phone, adress) {
    let user = { email: email, name: name, phone: phone, adress: adress };
    collection.insert(user, function(err, result) {
      console.log(result);
      if (err) {
        throw err;
      } else {
        socket.emit("register", user);
        console.log("insert success!");
      }
    });
  });

  socket.on("getBanners", function() {
    const cursor = bannerCollection.find({});
    cursor.each(function(err, data) {
      if (data != null) {
        console.log(data);
        socket.emit("getBanners", data);
      }
    });
  });

  socket.on("getLookBook", function() {
    const cursor = lookbookCollection.find({});
    cursor.each(function(err, data) {
      if (data != null) {
        console.log(data);
        socket.emit("getLookBook", data);
      }
    });
  });

  socket.on("getAllSalon", function() {
    const cursor = salonCollection.find({});
    cursor.each(function(err, data) {
      if (data != null) {
        console.log(data);
        socket.emit("getAllSalon", data);
      }
    });
  });
  socket.on("getBranch", function(name) {
    const cursor = branchCollection.find({ namesalon: name });
    cursor.each(function(err, data) {
      if (data != null) {
        console.log(data);
        socket.emit("getBranch", data);
      } else {
        // console.log(err);
      }
    });
  });

  socket.on("getBarbers", function(idBranch) {
    const cursor = barberCollection.find({ idBranch: idBranch });
    cursor.each(function(err, data) {
      if (data != null) {
        console.log(data);
        socket.emit("getBarbers", data);
      } else {
        // console.log(err);
      }
    });
  });

  socket.on("getTimeBooking", function(id, time) {
    const cursor = booktimeCollection
      .find({ $and: [{ barberId: id }, { date: time }] })
      .sort({ slot: 1 });
    cursor.forEach(function(data) {
      console.log(data);
      io.emit("getTimeBooking", data);
    });
  });

  socket.on(
    "addBooking",
    (
      barberId,
      barberName,
      customerName,
      customerPhone,
      salonId,
      salonAddress,
      salonName,
      slot,
      done,
      date,
      notification,
      cartItemList
    ) => {
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
      };
      booktimeCollection.insert(bookingInfo, function(err, result) {
        if (err) {
          console.log(err);
          throw err;
        } else {
          socket.emit("addBooking", result);
          console.log("addbooking" + result);
          let myNotification = JSON.parse(notification);
          notificationCollection.insert(myNotification, function(
            err,
            resultnotification
          ) {
            if (err) {
              console.log(err);
            } else {
              console.log(resultnotification);
            }
          });
          notificationCollection
            .find({ $and: [{ idBarber: barberId }, { read: false }] })
            .count(function(err, count) {
              if (err) {
                console.log(err);
              } else {
                io.emit("countNotification", count);
                console.log(count);
              }
            });
        }
      });
    }
  );
  socket.on("countNotification", idBarber => {
    notificationCollection
      .find({ $and: [{ idBarber: idBarber }, { read: false }] })
      .count(function(err, count) {
        if (err) {
          console.log(err);
        } else {
          socket.emit("countNotification", count);
          console.log(count);
        }
      });
  });

  socket.on("getNotification", idBarber => {
    notificationCollection
      .find({ $and: [{ idBarber: idBarber }, { read: false }] })
      .each(function(err, data) {
        if (err) {
          throw err;
          console.log(err);
        } else {
          socket.emit("getNotification", data);
          notificationCollection.updateMany(
            { idBarber: idBarber },
            { $set: { read: true } },
            function(err, data) {
              if (err) {
                throw err;
              } else {
                console.log("update notification", data);
              }
            }
          );
        }
      });
  });

  socket.on("checkemail", function(email, phone) {
    console.log(email, phone);
    collection.findOne({ $or: [{ email: email }, { phone: phone }] }, function(
      err,
      result
    ) {
      if (result != null) {
        console.log(result);
        socket.emit("checkemail", result);
      } else {
        socket.emit("checkemail", result);
        console.log("show dialog client for update infomation");
      }
    });
  });
  socket.on("getItemShopping", function(type) {
    const cursor = shoppingCollection.find({ type: type });
    cursor.each(function(err, data) {
      console.log(data);
      socket.emit("getItemShopping", data);
    });
  });

  socket.on("staffLogin", function(idBranch, userName, password) {
    barberCollection.findOne(
      {
        $and: [
          { idBranch: idBranch },
          { username: userName },
          { password: password }
        ]
      },
      function(err, isMatch) {
        if (err) {
        } else {
          console.log("staffLogin" + isMatch);
          socket.emit("staffLogin", isMatch);
        }
      }
    );
  });
  socket.on("updateToken", token => {
    let jsontoken = JSON.parse(token);
    console.log(jsontoken);
    if (jsontoken.idbarber != null) {
      console.log(jsontoken.idbarber);
      tokenCollection.update(
        { idbarber: jsontoken.idbarber },
        { idbarber: jsontoken.idbarber, token: jsontoken.token },
        { upsert: true }
      );
    } else if (jsontoken.phoneCustomer != null) {
      console.log(jsontoken.phoneCustomer);
      tokenCollection.update(
        { customerPhone: jsontoken.phoneCustomer },
        { customerPhone: jsontoken.phoneCustomer, token: jsontoken.token },
        { upsert: true }
      );
    }
  });
  socket.on("getToken", function(keytoken) {
    tokenCollection.findOne(
      { $or: [{ idbarber: keytoken }, { customerPhone: keytoken }] },
      function(err, data) {
        if (err) {
          throw err;
        }
        socket.emit("getToken", data);
        console.log("gettoken" + data);
      }
    );
  });
  socket.on("getBookInfomation", (idBookTime, customerPhone) => {
    if (idBookTime == null) {
      let cursor = booktimeCollection
        .find({ $and: [{ done: false }, { customerPhone: customerPhone }] })
        .sort({ _id: -1 })
        .limit(1);
      cursor.forEach(function(data) {
        socket.emit("getBookInfomation", data);
        console.log("GET BOOKING INFOMATION" + data);
      });
    } else {
      booktimeCollection.findOne({ _id: ObjectId(idBookTime) }, function(
        err,
        data
      ) {
        if (err) {
          throw err;
        } else {
          socket.emit("getBookInfomation", data);
          console.log("GET BOOKING INFOMATION" + data);
        }
      });
    }
  });
  socket.on("getBookingHistory", customerPhone => {
    booktimeCollection
      .find({ $and: [{ done: true }, { customerPhone: customerPhone }] })
      .sort({ _id: -1 })
      .forEach(data => {
        console.log("getBookingHistory ", data);
        socket.emit("getBookingHistory", data);
      });
  });
  socket.on("getServices", function() {
    serviceCollection.find({}).each(function(err, data) {
      if (err) {
        throw err;
      } else {
        socket.emit("getServices", data);
        console.log(data);
      }
    });
  });
  socket.on("doneService", idBookTime => {
    booktimeCollection.update(
      { _id: ObjectId(idBookTime) },
      { $set: { done: true } },
      function(err, data) {
        if (err) throw err;
        else {
          let cursor = booktimeCollection
            .find({ slot: false })
            .sort({ _id: -1 })
            .limit(1);
          cursor.each(function(err, data) {
            if (err) throw err;
            else {
              io.emit("getBookInfomation", data);
              console.log("getBookInfomation" + data);
            }
          });
          socket.emit("doneService", data.result);
          console.log(data.result);
        }
      }
    );
  });
  socket.on("Rating", (numberRating, commend, idBarber) => {
    if (numberRating != null && commend != null) {
      ratingCollection.insert(
        { rate: numberRating, commend: commend, idBarber: idBarber },
        function(err, result) {
          if (result) {
            ratingCollection
              .aggregate([
                { $match: { idBarber: idBarber } },
                { $group: { _id: {}, sum: { $sum: "$rate" } } }
              ])
              .each(function(err, data) {
                if (data != null) {
                  ratingCollection
                    .find({ idBarber: idBarber })
                    .count(function(err, number) {
                      if (err) {
                        throw err;
                      } else {
                        let ratingpercent = parseFloat(
                          (data.sum / number).toFixed(1)
                        );
                        barberCollection.update(
                          { _id: ObjectId(idBarber) },
                          { $set: { rating: ratingpercent } },
                          { upsert: true },
                          function(err, data) {
                            if (err) {
                              throw err;
                            } else {
                              console.log(data);
                            }
                          }
                        );
                      }
                    });
                }
              });
          }
        }
      );
    }
  });
  socket.on("adminLogin", function(userName, password) {
    adminCollection.findOne(
      { $and: [{ userName: userName }, { password: password }] },
      function(err, data) {
        console.log("admin login", data);
        socket.emit("adminLogin", data);
      }
    );
  });

  //Admin
  socket.on("addState", nameState => {
    salonCollection.insert({ name: nameState }, function(err, result) {
      if (err) {
        throw err;
      } else {
        console.log("add state", result.ops[0]);
        socket.emit("addState", result.ops[0]);
      }
    });
  });
  socket.on("deleteState", nameState => {
    salonCollection.remove({ name: nameState }, function(err, data) {
      if (data != null) {
        console.log("delete state", data);
        socket.emit("deleteState", data);
      }
    });
  });
  socket.on("updateState", (preState, nameState) => {
    salonCollection.update(
      { name: preState },
      { $set: { name: nameState } },
      function(err, data) {
        if (err) {
          throw err;
        } else {
          console.log("updateState", data);
          socket.emit("updateState", data);
        }
      }
    );
  });
  socket.on("deleteSalon", idSalon => {
    branchCollection.remove({ _id: ObjectId(idSalon) }, function(err, result) {
      if (err) {
        throw err;
      } else {
        console.log("Delete Salon", result);
        socket.emit("deleteSalon", result);
      }
    });
  });
  socket.on("addSalon", (nameState, name, address, website, phone) => {
    branchCollection.insert(
      {
        name: name,
        namesalon: nameState,
        adress: address,
        openHours: "9h00 - 19h00",
        website: website,
        phone: phone
      },
      function(err, data) {
        if (err) {
          throw err;
        } else {
          console.log("Add Salon Success", data.ops[0]);
          socket.emit("addSalon", data.ops[0]);
        }
      }
    );
  });
  socket.on("updateSalon", (id_salon, name, address, website, phone) => {
    branchCollection.update(
      { _id: ObjectId(id_salon) },
      { $set: { name: name, adress: address, website: website, phone: phone } },
      function(err, data) {
        if (err) {
          throw err;
        } else {
          branchCollection.findOne({ _id: ObjectId(id_salon) }, function(
            err,
            data
          ) {
            if (err) {
              throw err;
            } else {
              console.log("Update Salon Complete", data);
              socket.emit("updateSalon", data);
            }
          });
        }
      }
    );
  });
  socket.on("addBarber", (name, username, password, idsalon) => {
    barberCollection.findOne({ username: username }, function(err, isMatch){
      if (isMatch != null) {
        socket.emit("addBarber", "exits");
      } else if (err) {
        throw err;
      } else {
        barberCollection.insert(
          {
            name: name,
            username: username,
            password: password,
            rating: 0,
            idBranch: idsalon
          },
          (err, data) => {
            if (err) {
              throw err;
            } else {
              console.log("Them Nhan Vien", data.ops[0]);
              socket.emit("addBarber", data.ops[0]);
            }
          }
        );
      }
    });
  });
  socket.on("updateBarber", (id_barber, name, username, password) => {
    barberCollection.update(
      { _id:ObjectId(id_barber)},
      { $set: { name: name, username: username, password: password } },
      function(err, data) {
        if (err) {
          throw err;
        } else {
          barberCollection.findOne(
            { _id:ObjectId(id_barber)},
            (err, result) => {
              if (err) {
                throw err;
              } else {
                console.log("Cap nhat nhan vien", result);
                socket.emit("updateBarber", result);
              }
            }
          );
        }
      }
    );
  });
  socket.on('deleteBarber', id_barber=>{
    barberCollection.remove({_id:ObjectId(id_barber)},function(err,data){
      if(err){
        throw err
      }else{
        console.log('Xoa nhan vien ',data)
        socket.emit('deleteBarber', data)
      }
    })
  })
  socket.on('addProduct', (selectedChip, name, price, url_image)=>{
    shoppingCollection.insert({type:selectedChip,name:name,image:url_image,price:price},function(err,data){
      if(err){
        throw err
      }else{
        console.log(data)
        socket.emit('addProduct', data.ops[0])
      }
    })
  })
  socket.on('updateProduct',(id_product, name, price)=>{
    shoppingCollection.update({_id:ObjectId(id_product)},{$set:{name:name,price:price}},function(err,data){
      if(err){
        throw err
      }else{
        shoppingCollection.findOne({_id:ObjectId(id_product)},function(err,data){
          if(err){
            throw err;
          }else{
            socket.emit('updateProduct',data)
          }
        })
      }
    })
  })
  socket.on('deleteProduct', id_product=>{
    shoppingCollection.remove({_id:ObjectId(id_product)},function(err,data){
        if(err) {
          throw err
        }
        else{
          console.log(data)
            socket.emit('deleteProduct',data);
        }
    })
  })
  socket.on('updateService',(id_service,name, price)=>{
    serviceCollection.update({_id:ObjectId(id_service)},{name:name,price:price},function(err,data){
      if(err){
        throw err;
      }else{
        serviceCollection.findOne({_id:ObjectId(id_service)},function(err,data){
          if(err){
            throw err
          }else{
            console.log('Cập nhật dịch vụ', data)
            socket.emit('updateService', data);
          }
        })
      }
    })
  })
  socket.on('deleteService', id_service=>{
    serviceCollection.remove({_id:ObjectId(id_service)},function(err,data){
      if(err){
        throw err;
      }else{
        socket.emit('deleteService', data)
      }
    })
  })
  socket.on('addService',(name, price)=>{
    serviceCollection.insert({name:name, price:price},function(err,data){
      if(err){
        throw err
      }else{
        console.log('Thêm dịch vụ', data.ops[0])
        socket.emit('addService', data.ops[0])
      }
    })
  })
  socket.on('getAssessment', id_barber=>{
    console.log(id_barber)
    ratingCollection.find({idBarber:id_barber}).forEach(function(data){
      var date =ObjectId(data._id).getTimestamp()+0700
      data.time = date.substring(16,24)
      data.date = date.substring(4,15);
      console.log(data)
      socket.emit('getAssessment',data)
      
    })
  })
});
