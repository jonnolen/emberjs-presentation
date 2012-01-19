window.App = Ember.Application.create("#appContainer"), stubContent;
/* Models */
Ingredient = Ember.Object.extend({
  amount: "",
  description: "",
  optional: false,
  substitution: null,
  hasSubstitution: function(){
    return this.substitution !== null;
  }
});

Ingredient.reopenClass({
  blankIngredient:function(){
    return Ingredient.create({
      amount:"--",
      description:"--"
    });
  }
});

IngredientSection = Ember.Object.extend({
  sectionName:"",
  ingredients:[],
  addIngredient:function(){
    var newIngredient = Ingredient.blankIngredient();
    this.get("ingredients").pushObject(newIngredient); 
  }
});
IngredientSection.reopenClass({
  createFromJson: function(json){
    var ingredients = json.ingredients.map(function(ingredient){
      return Ingredient.create(ingredient);
    });
    json.ingredients = ingredients;                                       
    return IngredientSection.create(json);
  },
  /* when creating objects if you don't explicitly set all of the array 
or object objects in teh create method then all of the created objects 
will have share the object set in the extend method.  Thats why you create 
a class method like this one to provide a default create that news up that 
array object. */
  createBlank:function(){
    return IngredientSection.create({
      sectionName:"",
      ingredients:[]
    });
  }
});

Instruction = Ember.Object.extend({
  description: "",
  time:null
});
                      
Recipe = Ember.Object.extend({
  name:"",
  ingredientSections:[],
  instructions:[],
  meta:[],
  tags:[],  
  /*isModified, isNew and save are nice thoughts reserved for a future when you can edit 
  a report and then save it back to a server. */
  isModified:false,
  isNew:false,
  save:function(){
    alert("I've been saved!");
    this.set("isModified", false);
    this.set("isNew", false);
  },
  /* meta information can't just be an array of strings.. if it's just an array of 
   strings then you won't be able to edit because strings are immutable primitives*/
  addMetaInformation:function(){
    this.get("meta").pushObject({"meta":"click here to edit"});  
  },
  addIngredientSection:function(){
    var newIngredientSection = IngredientSection.createBlank();
    newIngredientSection.set("sectionName", "Double click to Edit");
    this.get("ingredientSections").pushObject(newIngredientSection);
  },
  addInstruction:function(){
    var newInstruction = Instruction.create({
      description:"click to edit",
      time:null
    });
    this.get("instructions").pushObject(newInstruction);
  }
});

Recipe.reopenClass({
  createFromJson: function(json){
    var ingredientSections = json.ingredients.map(function(ingredientSection){
      return IngredientSection.createFromJson(ingredientSection);
    });
    // so this is nice. ember includes a bunch of collection operators, i.e. map.
    var instructions = json.instructions.map(function(instruction){
      return Instruction.create(instruction);
    });

    json.ingredientSections = ingredientSections;
    json.instructions = instructions;
    json.meta = json.meta.map(function(metaString){ return {"meta":metaString};});
    return Recipe.create(json);  
  }
});


/* views */
App.RecipeListView = Ember.View.extend({
  "templateName":"RecipeListView"
});
 
App.RecipeListViewItem = Ember.View.extend({
  "templateName":"RecipeListViewItem",
  // this will produce a "dasherized" class name is-selected if the computed
  // property isSelected is true.
  "classNameBindings":"isSelected",
  "click":function(evt){
    var recipe = this.get('recipe');
    App.selectedRecipeController.set("recipe", recipe);
  },
  //computed property!
  "isSelected":function(){ 
    return App.selectedRecipeController.get("recipe") === this.get("recipe");
  }.property("App.selectedRecipeController.recipe")
});

App.ActiveRecipeView = Ember.View.extend({
  "templateName":"ActiveRecipeView"
});

App.EditRecipeView = Ember.View.extend({
  templateName:"EditRecipeView",
  controllerBinding:null
});

App.IngredientView = Ember.View.extend({
  templateName:"ingredient-view",
  tagName:"span"
});

App.InstructionView = Ember.View.extend({
  templateName:"instruction-view",
  tagName:"span"
});

App.EditableText = Ember.View.extend({
  templateName:"editable-text",
  tagName:"span",
  doubleClick:function(){
    this.set("isEditing", true);
    return false;
  },
  focusOut:function(){
    this.set("isEditing", false);
  },
  keyUp:function(evt){
    if (evt.keyCode === 13) {
      this.set('isEditing', false);
    }
  }
});

App.EditableIngredient = Ember.View.extend({
  templateName:"edit-ingredient",
  tagName:"span",
  doubleClick:function(){
    this.set("isEditing", true);
    return false;
  },
  keyUp:function(evt){
    if (evt.keyCode === 13){
      this.set("isEditing", false);
    }
  }
});

App.EditableInstruction = Ember.View.extend({
  templateName:"edit-instruction",
  tagName:"span",
  doubleClick:function(){
    this.set("isEditing", true);
    return false;
  },
  keyUp:function(evt){
    if (evt.keyCode === 13)
      this.set("isEditing", false);
  }
});

// focusOut and keyUp don't bubble up to 
// parentViews.   So this check to see if
// there is a parent view, and if it has a method
// for keyup or focusout.  if there are it calls
// them.  bubbling by hand.
App.TextField = Ember.TextField.extend({
  autofocus:true,
  didInsertElement:function(){
    if (this.get("autofocus") === true)
      this.$().focus();
  },
  focusOut:function(){
    var value = Ember.getPath(this, "parentView");
    if (value && value.focusOut)
      value.focusOut();
  },
  keyUp: function(evt) {
    var value = Ember.getPath(this, "parentView");
    if (value && value.keyUp)
      value.keyUp(evt);
  }
});
App.Checkbox = Ember.Checkbox.extend({
  keyUp:function(evt){
    var value = Ember.getPath(this, "parentView");
    if (value && value.keyUp)
      value.keyUp(evt);
  }
});
                                

Ember.Handlebars.registerHelper("editable", function(path, options){
  options.hash.valueBinding = path;
  Ember.Handlebars.helpers.view.call(this, App.EditableText, options);
});

Ember.Handlebars.registerHelper("text", function(path, options){
  options.hash.valueBinding = path;
  options.hash.autofocus = false;
  Ember.Handlebars.helpers.view.call(this, App.TextField, options);
});
/* allows for {{checkbox valuePath}} which is needed in order to 
get an html check box to bind to a property*/
Ember.Handlebars.registerHelper("checkbox", function(path, options){
  options.hash.valueBinding = path;
  options.hash.tagName = "span";
  
  Ember.Handlebars.helpers.view.call(this, Ember.Checkbox, options);
});

/* block helper that allows us to create a link formatted view*/
Ember.Handlebars.registerHelper("linkButton", function(path,options){
  /* if a path is not passed into a block helper then the context is the 
"this" from the calling code.  if that's the case then the path variable
will actually be the options variable.  in that case then we want
to set the options varialbe to be the path variable and set the target
to this (for our purposes).

This allows for:
{{#linkButton action="someMethod"}}button name{{/linkButton}}
and
{{#linkButton "handlebarsPath" action="someMethod"}}button name{{/linkButton}}*/
 
  var target = null;
  if (!options){
    options = path;
    target = "this";
  }
  else{
    target = path;
  }
  options.hash.tagName = "a";
  options.hash.targetBinding = target;
  options.hash.class = "link-button";

  Ember.Handlebars.helpers.view.call(this, Ember.Button, options);
});
/* controllers */

App.recipeListController = Em.Object.create({
  content:[],
  loadRecipes:function(){
    var self = this;
    $.getJSON("recipes.json")
      .success(function(response){
        var recipes = response;
        recipes = recipes.map(function(recipe){
          return Recipe.createFromJson(recipe);
        });
        
        self.set("content", recipes);
      })
      .error(function(req, textStatus, error){
        console.log(textStatus);
        self.set("content", stubContent());
      });
  },
  addRecipe:function(){
    var recipe = Recipe.create({name:"Recipe " + App.recipeListController.content.length.toString(),
                                ingredientSections:[],
                                instructions:[],
                                meta:[],
                                tags:[]
                               });
    this.content.pushObject(recipe);
    App.selectedRecipeController.set("recipe", recipe);
    App.selectedRecipeController.set("isEditing", true);
  }
});
App.selectedRecipeController = Em.Object.create({
  recipe:null,
  isEditing:false,
  saveRecipe:function(){
    this.set("isEditing", false);
  },
  editRecipe:function(){
    this.set("isEditing", true);
  }
});


function stubContent(){
  return [Recipe.create({name:"Bryanna's Tofu Seitan Roast",
                         ingredients:[
                           Ingredient.create({
                             amount: "2c",
                             description: "vital wheat gluten",
                             optional:false}),
                           Ingredient.create({
                             amount: "15oz",
                             description: "package firm regular tofu (not silken)",
                             optional:false
                           }),
                           Ingredient.create({
                             amount: "3T",
                             description: "Hot Asian Cock Sauce",
                             optional:true
                           })
                         ]}),
          Recipe.create({name:"Meaty Mushroom Spaghetti"}),
          Recipe.create({name:"Bayou Chowder"})];
}


$(document).ready(function(){
  App.recipeListController.loadRecipes();
});
