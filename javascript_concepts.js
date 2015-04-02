// Simple variable
var length = 2;

console.log(length);

// Object (sometimes called a hash)
// An object has properties (sometimes called attributes or keys)
var desk = {
    width: 2,
    length: 4,
    height: 3,
    color: 'red'
};

console.log("The deks color is", desk.color);
console.log("The desk length is", desk["length"]);

// With the bracket syntax, the property name (also called the key or index) can be a variable
var dimension = "height";
console.log(desk[dimension]);

// Array
var colors = [
    "red", 
    "orange",
    "yellow", 
    "green", 
    "blue", 
    "violet" 
];

// Array indexes start with zero
// Objects have keys (indexes) that are strings (words); arrays have keys (indexes) that are numbers.
console.log("The third color is", colors[2]);

var i = 0;
while (i < colors.length) {
    console.log(colors[i]);
    i += 1;
}

// Functions take some input, do some work, and return a value
var double = function(x) {
    return x * 2;
}

var students = [
    {first_name: "Bob", last_name: "Smith"},
    {first_name: "Kelly", last_name: "Jones"}
];

console.log(students[0].last_name.toUpperCase() + ", " + students[0].first_name);
console.log(students[1].last_name.toUpperCase() + ", " + students[1].first_name);

// This function expects two parameters to be passed to it.
// They will be assigned as first_name and last_name.
var full_name = function(first_name, last_name) {
    return "<span style='color: #ff0000;'>" + last_name.toUpperCase() + "</span>, " + first_name;
};

console.log(full_name(students[0].first_name, students[0].last_name));
console.log(full_name(students[1].first_name, students[1].last_name));

// This function expects one parameter to be passed to it: A student object
var full_name_again = function(student) {
    return student.last_name.toUpperCase() + ", " + student.first_name;
}

console.log(full_name_again(students[0]));
console.log(full_name_again(students[1]));

var i = 0;
while (i < students.length) {
    console.log(full_name_again(students[i]));
    i += 1;
}

// Encapsulation

var double = function() {
    // This is bad because it relies on variables set outside of the function
    return x * 2;
}

var x = 5;
console.log(double());

var double = function(x) {
    // This is good because everything is self-contained within the function
    return x * 2;
}
var y = 5;
console.log(double(y));


// ADVANCED CONCEPT BELOW HERE

// Object properties can BE functions

var desk = {
    width: 2,
    length: 4,
    height: 3,
    color: 'red',
    // When an object's property is actually a function, it's called a method
    greet: function(name) {
        console.log("Hello human", name);
        console.log("My area is ", this.width * this.length);
    }
};

desk.greet();
