const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ID counters, increase when new entry pushed into array.
let cartId = 0;
let UserId = 0;
let storeItemId = 0;
let cartItemId = 0;

// Cart/User/Item arrays to hold users, carts, items
let carts = []; //change all cart to carts All carts stored here
let users = [];
let storeItems = [];
let cartItems = [];

// API Key for randommer imports
const config = {
    headers: {
        'X-Api-Key': '7542e71a409f40da97408a0992a9e53e'
    }
}

/********************************************************
 * Functions to populate shopping items and users       *
 ********************************************************/

// populate rand # for cart, return array of #storeItems
let populateCart = () => {
    let cart = []
    for(let i =0; i < 10; i++)
    {
        cart.push(storeItems[(Math.floor(Math.random() * 100))])
    }
    return cart;
}

// Generate random users and add them to the array of users
const getNameDataInParallel = async () => {
    const firstNamePromise = axios.get('https://randommer.io/api/Name?nameType=firstname&quantity=20', config);
    const lastNamePromise = axios.get('https://randommer.io/api/Name?nameType=surname&quantity=20', config);

    let results = await Promise.all([firstNamePromise, lastNamePromise]);
        results[0].data.forEach((name, index) => {
            users.push({"UserId": UserId++,
            name : {
                firstName: name,
                lastName: results[1].data[index]},
                cart: populateCart(),
                Email: name + results[1].data[index] + "@ex.com"
            });
        })
    }

// Generate a bunch of random items for the store
const getStoreItems = async() => {
    const itemResult = await axios.get('https://randommer.io/api/Name/Suggestions?startingWords=item', config);
    itemResult.data.forEach((itemName, index) => {
        let newItem = {storeItemId : storeItemId++,
            storeItemName : itemName,
            storeItemQuantity : Math.floor(Math.random() * 10)
        };
        storeItems.push(newItem);
    })
    console.log(storeItems);
}

// Syncs up functions that populate users and items
const initializeData = async() => {
    await getStoreItems();
    // Sample user to use for debugging
    const sampleUser = {
        UserId : UserId++,
        name : {
            firstName: "Colten",
            lastName: "Coffman"
        },
        cart : [storeItems[1], storeItems[2], storeItems[3], storeItems[4]],
        emailAddress : "chc69@txstate.edu",
    }
    users.push(sampleUser);
    await getNameDataInParallel();
    console.log(JSON.stringify(users));
//    console.log(users);
}
initializeData();

/********************************************************
 * GET functions to return requested information        *
 ********************************************************/
// Get all of the users
app.get('/users', (req, res) => {
    res.send(users);
})

// Get user by ID
app.get('/user/:UserId', (req, res) => {
   let reqUserId = users.find((users) => {
       return users.UserId == req.params.UserId;
   })
    res.send(reqUserId);
});

// Get a store item by ID
app.get('/StoreItem/:storeItemId', (req, res) => {
    let reqStoreItemId = storeItems.find((storeItems) => {
        return storeItems.storeItemId == req.params.storeItemId;
    })
    res.send(reqStoreItemId);
});

// Get the cart of a specified user
app.get('/user/:UserId/cart', (req, res) => {
    let reqUserId = users.find((users) => {
        return users.UserId == req.params.UserId;
    })
    res.send(reqUserId.cart);
});

// Get a store item regex query of part of the item's name
app.get('/StoreItem', (req, res) => {
    let foundStoreItem = storeItems;
    if(req.query.storeItemName){
        foundStoreItem = storeItems.filter((storeItem) => {
            return storeItem.storeItemName.includes(req.query.storeItemName);
        });
    }
    res.send(foundStoreItem);
});

/********************************************************
 * POST functions to create new entries                 *
 ********************************************************/

// Create a user using a post
app.post('/user', (req, res) => {
    let newUser = {};
    newUser.UserId = UserId++;
    newUser.name = {};
    newUser.name.firstName = req.body.name.firstName;
    newUser.name.lastName = req.body.name.lastName;
    newUser.cart = req.body.cart;
    newUser.emailAddress = req.body.emailAddress;

    users.push(newUser);
    res.send(newUser);
})

// Add a new item to specified user's cart
app.post('/cart/:UserId/cartItem', (req, res) => {
    let reqUserIdCart = users.find((users) => {
        return users.UserId == req.params.UserId;
    })
    let newStoreItem = {};
    newStoreItem.storeItemId = req.body.storeItemId;
    newStoreItem.storeItemName = req.body.storeItemName;
    newStoreItem.storeItemQuantity = req.body.storeItemQuantity;

    reqUserIdCart.cart.push(newStoreItem);
    res.send(reqUserIdCart.cart);
})

/********************************************************
 * DELETE functions to delete specified entries         *
 ********************************************************/
// Empties specific user's cart
app.delete('/user/:UserId/cart', (req, res) => {
    let reqUserId = users.find((users) => {
        return users.UserId == req.params.UserId;
    })
    reqUserId.cart.splice(0, reqUserId.cart.length);
    res.send(reqUserId.cart);
});
// Deletes the index of the item in the specified user's cart and sends remaining items back
app.delete('/cart/:UserId/:cartItemId', (req, res) => {
    let reqUserId = users.find((users) => {
        return users.UserId == req.params.UserId;
    })
    reqUserId.cart.splice(req.params.cartItemId, 1);
    res.send(reqUserId.cart);
});

app.listen(3000);