//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { name } = require("ejs");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-vikash:tqbfjotld@cluster0.pt8ue.mongodb.net/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//Model created
const Item = mongoose.model("Item", itemsSchema);

//Starting 3 default Items
const item1 = new Item({
    name: "Welcome to your to do list!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems) {
        if (foundItems.length == 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err)
                    console.log(err);
                else
                    console.log("Successfully inserted 3 default items.");
            });
        }
        res.render("list", { listTitle: "Today", newListItems: foundItems });
    })
});

app.get("/:customListName", function(req, res) {
    const topic = _.capitalize(req.params.customListName);

    List.findOne({ name: topic }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: topic,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + topic)
            } else {
                //Show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
})

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function(req, res) {
    const listName = req.body.listName;
    const checkboxID = req.body.checkbox;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkboxID, (err) => {
            if (err)
                console.log(err);
            else {
                console.log("Successfully deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkboxID } } }, function(err, result) {
            if (!err) {
                res.redirect("/" + listName);
            }
        })
    }
})


app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});