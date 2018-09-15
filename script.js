var PRESENTATION_ID = '11Vza3FSJS7mq6CSOfHPpsF77pyGDSaVs8R5zQyNogL4'
var documentString;
var highlightDictionary = {};
var curPageId = null;
var curClickedElements = [];
var myDB;
var jsonMetaData, xmlMetaData;
var tei, json;
var userID, documentID;
var windowsHeight, windowsWidth;
var outlineInfo = [];
var slideInfo = [];

Array.prototype.insert = function ( index, item ) {
        this.splice( index, 0, item );
};

Array.prototype.remove= function ( index ) {
        this.splice( index, 1 );
};

function issueEvent(object, eventName, data) {
    var myEvent = new CustomEvent(eventName, {detail: data} );

    // window.postMessage(eventName, "*");

    object.dispatchEvent(myEvent);
}

function getKeyword(sentence, callback) {
    $.ajax({
			type: 'POST',
    	    url: 'http://localhost:3000',
    	    data: sentence,
    	    success:function(data){
    	      if(data.indexOf("%%RESULT_RETURN%%") == -1){
    	          callback("NULL")
    	      }
    	      else {
  			    var myString = data.split("%%RESULT_RETURN%%")[1]
  			    myString = myString.split("\n")

  			    for(var i=0;i<myString.length;i++) {
  			    	myString[i] = myString[i].split("\t")
  			    }

    	        if(callback != null) {
  		           callback(myString)
    	        }
    	      }
    	    }
		});
}

function highlightPhrase(paragraphIndex, phraseStartIndex, count) {
	$("<span id='highlightPhrase" + paragraphIndex + "_" + phraseStartIndex + "' class='highlightPhrase'></span>").insertBefore("#segment_" + paragraphIndex + "_" + phraseStartIndex)

	for(var i=0;i<count;i++) {
		$("#segment_" + paragraphIndex + "_" + (phraseStartIndex+i)).appendTo($("#highlightPhrase" + paragraphIndex + "_" + phraseStartIndex));
		$("#highlightPhrase" + paragraphIndex + "_" + phraseStartIndex).append(" ");
	}
}

function highlightParagraph(pIndex) {
    getKeyword(documentString[pIndex], function(keywords) {
		if(keywords != 'NULL') {
       		 for(var i=0;i<keywords.length;i++) {
       		     var word = keywords[i][0];
       		     var characterIndex = documentString[pIndex].toLowerCase().indexOf(word);
	   		 	 var substrIndex = documentString[pIndex].substr(0, (characterIndex+1)).split(' ').length-1

	   		 	 var wordCount = (keywords[i][0].split(' ').length);

	   		 	 highlightPhrase(pIndex, substrIndex, wordCount);
       		 }
		}
    });
}

function readTextFile(file, filetype)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText.replace(/\\r\\n/g, "<br />");
                
                allText = allText.split("\n");
                documentString = allText;

                console.log(allText);
                console.log(allText.join([separator = '']));

				if(filetype == 'xml') {
					tei = $.parseXML(allText.join([separator = '']))
					xmlMetaData = $.parseXML(allText.join([separator = '']));
					console.log(xmlMetaData);
				}
				else if(filetype == 'json'){
					json = $.parseJSON(allText.join([separator = '']))
					jsonMetaData = $.parseJSON(allText.join([separator = '']))
					console.log(jsonMetaData);
				}

/*
                for(var i=0;i<allText.length;i++) {
                    var segment = allText[i].split(" ");
                    var myString = "<div id='paragraph" + i + "' class='paragraph'>"

                    for(var j=0;j<segment.length;j++) {
                        myString += "<span id='segment_" + i + "_" + j + "' class='word'>";
                        myString += segment[j];
                        myString += "</span>";
                        myString += ' ';
                    }

                    myString += "</div>";
                    $("#leftPlane").append(myString);
                }

               //  $("#leftPlane").append("<pre id='documentText'>" + allText + "</pre>");

				for(var i=0;i<allText.length;i++) {
                	highlightParagraph(i);
				}
*/
            }
        }
    }
    rawFile.send(null);
}

function initializeGAPI() {
      // Client ID and API key from the Developer Console
      var CLIENT_ID = '1080216621788-nsdlr416il84hr9t6nkrb9fv3b663tgk.apps.googleusercontent.com';
      var API_KEY = 'AIzaSyDtDPjTzXFIxzaYwz-qyaHAty-16vCNOJo';

      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://slides.googleapis.com/$discovery/rest?version=v1", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      var SCOPES = "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/script.scriptapp https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/script.external_request https://www.googleapis.com/auth/drive.metadata.readonly";

      var authorizeButton = document.getElementById('authorize-button');
      var signoutButton = document.getElementById('signout-button');

      /**
       *  On load, called to load the auth2 library and API client library.
       */
      function handleClientLoad() {
        gapi.load('client:auth2', initClient);
      }

      /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */
      function initClient() {
          console.log("INIT");
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(function () {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          authorizeButton.onclick = handleAuthClick;
          signoutButton.onclick = handleSignoutClick;
        });
      }

      /**
       *  Called when the signed in status changes, to update the UI
       *  appropriately. After a sign-in, the API is called.
       */
      function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
          authorizeButton.style.display = 'none';
          // signoutButton.style.display = 'block';
          listSlides();

          // callAppsScript(gapi.auth2.getAuthInstance());
        } else {
          authorizeButton.style.display = 'block';
          // signoutButton.style.display = 'none';
        }
      }

      /**
       *  Sign in the user upon button click.
       */
      function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
      }

      /**
       *  Sign out the user upon button click.
       */
      function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
      }

      /**
       * Append a pre element to the body containing the given message
       * as its text node. Used to display the results of the API call.
       *
       * @param {string} message Text to be placed in pre element.
       */
      function appendPre(message) {/*
        var pre = document.getElementById('slideContents');
        var textContent = document.createTextNode(message + '\n');
        pre.appendChild(textContent);*/
      }

      /**
       * Prints the number of slides and elements in a sample presentation:
       * https://docs.google.com/presentation/d/1EAYk18WDjIG-zp_0vLm3CsfQh_i8eXc67Jo2O9C6Vuc/edit
       */

      function createSlide() {
        var requests = [{
          createSlide: {
            slideLayoutReference: {
              predefinedLayout: 'TITLE_AND_TWO_COLUMNS'
            }
          }
        }];
        
        // If you wish to populate the slide with elements, add element create requests here,
        // using the pageId.
        
        // Execute the request.

        console.log("start!");

        gapi.client.slides.presentations.batchUpdate({
          presentationId: PRESENTATION_ID,
          requests: requests
        }).then((createSlideResponse) => {
          console.log(`Created slide with ID: ${createSlideResponse.result.replies[0].createSlide.objectId}`);
        });
      }

      function listSlides() {
        gapi.client.slides.presentations.get({
          presentationId: PRESENTATION_ID
        }).then(function(response) {
          $("#outlinePlaneContent").text('');

          var presentation = response.result;
          var length = presentation.slides.length;

          for (i = 0; i < length; i++) {
            var slide = presentation.slides[i];

            var slideID = slide.objectId;
            var slideObjId = [];

            function compare(a, b) {
                if(a.objectId > b.objectId) return true;
                else return false;
            }

            slide.pageElements.sort(compare);

            for(var j=0;j<slide.pageElements.length;j++) {
                var slideItem = slide.pageElements[j];

                var slideObjParagraphId = [];

                if(slideItem.shape.text != null) {
                    var nestingLevel = 0;
                    var isFirstTextRun = true;
                    var paragraphId = -1;

                    for(var k=0;k<slideItem.shape.text.textElements.length;k++) {
                        var textElem = slideItem.shape.text.textElements[k];

                        if(textElem.paragraphMarker != null) {
                            paragraphId = paragraphId + 1;
                        }

                        var paragraphObjId = "editor-" + slideItem.objectId + "-paragraph-" + paragraphId;
                        var domId = '';

                        if(textElem.paragraphMarker != null && textElem.paragraphMarker.bullet != null) {
                            if(textElem.paragraphMarker.bullet.nestingLevel != null) {
                                nestingLevel = parseInt(textElem.paragraphMarker.bullet.nestingLevel);
                            }
                            else nestingLevel = 0;
                        }
                        else if(textElem.textRun != null){
                            var level = (j == 0? nestingLevel : nestingLevel + 1);

                            // domId = appendOutlineLine(level, textElem.textRun.content, paragraphObjId);

                            isFirstTextRun = false;

                            slideObjParagraphId.push({
                                    slideParagraphObjId: paragraphObjId,
                                    domId: domId
                                    });
                        }
                    }
                }

                slideObjId.push({
                    slideObjId: slideItem.objectId,
                    slideParagraphs: slideObjParagraphId
                    });
            }

            slideInfo.push({
                slideID: slideID,
                slideObjs: slideObjId
            });
            
            console.log(slideInfo);
          }
        }, function(response) {
          appendPre('Error: ' + response.result.error.message);
        });
      }

      /**
       * Shows basic usage of the Apps Script API.
       *
       * Call the Apps Script API to create a new script project, upload files
       * to the project, and log the script's URL to the user.
       *
       * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
       */
/*
      function callAppsScript(auth) {
        gapi.client.script.projects.create({
          resource: {
            title: 'My Script'
          }
        }).then((resp) => {
          return gapi.client.script.projects.updateContent({
            scriptId: resp.result.scriptId,
            resource: {
              files: [{
                name: 'hello',
                type: 'SERVER_JS',
                source: 'function helloWorld() {\n  console.log("Hello, world!");\n}'
              }, {
                name: 'appsscript',
                type: 'JSON',
                source: "{\"timeZone\":\"America/New_York\",\"" +
                   "exceptionLogging\":\"CLOUD\"}"
              }]
            }
          });
        }).then((resp) => {
          let result = resp.result;
          if (result.error) throw result.error;
          console.log(`https://script.google.com/d/${result.scriptId}/edit`);
        }).catch((error) => {
          // The API encountered a problem.
          return console.log(`The API returned an error: ${error}`);
        });
      }*/

      handleClientLoad();
}

function storeData(pageId, objIdList, pageNumber, startIdx, endIdx, color) {
    for(var i=0;i<objIdList.length;i++) {
        myDB.put({
          "_id": createObjId(),
          "userId": userID,
          "documentId": documentID,
          "pageId": pageId,
          "objId": objIdList[i],
		  "pageNumber": pageNumber,
          "startIdx": startIdx,
          "endIdx": endIdx,
          "color": color
        }).then(function (response) {
          // handle response
            console.log("SUCCEED STORE DATA");

            loadData();

        }).catch(function (err) {
          console.log(err);
        });
    }
}

function loadData() {
	myDB.allDocs({
	  include_docs: true,
	  attachments: true
	}).then(function (result) {
      var flag = false;
	  console.log(result);

      for(var i=0;i<result.rows.length;i++) {
         var elem = result.rows[i].doc;

         if(elem.userId == userID && elem.documentId == documentID) {
             addHighlight(elem.pageId, [elem.objId], elem.pageNumber, elem.startIdx, elem.endIdx, elem.color, false);
             flag = true;
         }
      }

      if(flag) {
        updateHighlight(curPageId, []);
      }
      else {
        
      }
	}).catch(function (err) {
	  console.log(err);
	});
}

function createObjId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 20; i++)
  	  text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function addHighlight(pageId, objIdList, pageNumber, startIdx, endIdx, color, flag) {
    if(!(pageId in highlightDictionary)) {
        highlightDictionary[pageId] = {};
    }

    for(var i=0;i<objIdList.length;i++) {
        objId = objIdList[i];

        if(!(objId in highlightDictionary[pageId])) {
            highlightDictionary[pageId][objId] = [];
        }

        highlightDictionary[pageId][objId].push([pageNumber, startIdx, endIdx, color]);
    }

    if(flag)
        storeData(pageId, objIdList, pageNumber, startIdx, endIdx, color);
}

function updateHighlight(pageId, objIdList) {
    /*
    console.log(pageId);
    console.log(objIdList);*/

    issueEvent(document, "PDFJS_REMOVE_HIGHLIGHT", null);

    if(!(pageId in highlightDictionary)) return;

    var keys = Object.keys(highlightDictionary[pageId]);

    for(var i=0;i<keys.length;i++) {
      var thisKey = keys[i];

      for(var j=0;j<highlightDictionary[pageId][thisKey].length;j++) {
          var pageNumber = highlightDictionary[pageId][thisKey][j][0];
          var startIdx = highlightDictionary[pageId][thisKey][j][1];
          var endIdx = highlightDictionary[pageId][thisKey][j][2];
          var color = highlightDictionary[pageId][thisKey][j][3];

          issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                  {
					"pageNumber": pageNumber,
                     "startIndex": startIdx,
                     "endIndex": endIdx,
                     "slideObjId": thisKey,
                     "color": color,
          });
      }
    }
}

function clearDatabase() {
	myDB.allDocs({
	  include_docs: true,
	  attachments: true
	}).then(function (result) {
	  console.log(result);

      for(var i=0;i<result.rows.length;i++) {
         var elem = result.rows[i].doc;

         myDB.remove(elem);
      }
	}).catch(function (err) {
	  console.log(err);
	});
}

function generateObjId() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function getTextInEditor(index) {
    return $("#outlineLineEditor_" + index).text();
}

function increaseLevel(index) {
    setLevel(index, outlineInfo[index].level+1);
}

function decreaseLevel(index) {
    setLevel(index, outlineInfo[index].level-1);
}

function setLevel(index, level) {
    var bulletStyle = '';

    if(level == 0) {
        bulletStyle = 'T';
    }
    else if(level == 1) {
        bulletStyle = '*';
    }
    else if(level == 2) {
        bulletStyle = '-';
    }

    $("#outlineLineBullet_" + index).text(bulletStyle);

    $("#outlineLineBullet_" + index).css("width", 30 * (level+1));
    $("#outlineLineEditor_" + index).css("margin-left", $("#outlineLineBullet_" + index).width()+3);

    outlineInfo[index].level = level;
}

function appendOutlineLine(level, text, paragraphId) {
    return putNewOutlineLine(outlineInfo.length, level, text, paragraphId);
}

function putNewOutlineLine(index, level, text, paragraphId) {
    var objId = generateObjId();

    if(outlineInfo.length == 0) {
        $("#outlinePlaneContent").append(
            "<div id='outlineLine_" + index + "' class='outlineLineWrapper' objId=" + objId + " paragraphId=" + paragraphId + ">" + 
                "<div id='outlineLineBullet_" + index + "' class='outlineBullet'> * </div>" + 
                "<div id='outlineLineEditor_" + index + "' class='outlineLineEditor' contenteditable='true'>" + text + "</div>" + 
            "</div>"
            );
    }
    else {
        for(var i=outlineInfo.length-1;i>=index;i--) {
            $("#outlineLine_" + i).attr("id", "outlineLine_" + (i+1));
            $("#outlineLineBullet_" + i).attr("id", "outlineLineBullet_" + (i+1));
            $("#outlineLineEditor_" + i).attr("id", "outlineLineEditor_" + (i+1));
        }

        $("#outlineLine_" + (index-1)).after(
            "<div id='outlineLine_" + index + "' class='outlineLineWrapper' objId=" + objId + " paragraphId=" + paragraphId + ">" + 
                "<div id='outlineLineBullet_" + index + "' class='outlineBullet'> * </div>" + 
                "<div id='outlineLineEditor_" + index + "' class='outlineLineEditor' contenteditable='true'>" + text + "</div>" + 
            "</div>"
            );
    }

    outlineInfo.insert(index, {
            "id": objId,
            "level": level,
            });

    setLevel(index, level);

    return objId;
}

function removeOutlineLine(index) {
    $("#outlineLine_" + index).remove();

    for(var i=index+1;i<outlineInfo.length;i++) {
        $("#outlineLine_" + i).attr("id", "outlineLine_" + (i-1));
        $("#outlineLineBullet_" + i).attr("id", "outlineLineBullet_" + (i-1));
        $("#outlineLineEditor_" + i).attr("id", "outlineLineEditor_" + (i-1));
    }

    outlineInfo.remove(index);
}

$(document).ready(function() {
       initializeGAPI();

      $("#createSlideButton").on("click", function() {
        createSlide();
        listSlides();
      });
	
      function getPageInfo(pageID) {
        gapi.client.slides.presentations.pages.get({
          presentationId: PRESENTATION_ID,
          pageObjectId: pageID
        }).then(function(response) {
            console.log(response);
        }, function(response) {
          appendPre('Error: ' + response.result.error.message);
        });
      }

      $(document).on("addText", function(e) {
          console.log(e);

          console.log(e.detail.color);
          addText(e.detail.objId, e.detail.pageId, e.detail.text, e.detail.pageNumber, e.detail.startIndex, e.detail.endIndex, e.detail.color);
      });

      $(document).on("getSlideInfo", function() {
        gapi.client.slides.presentations.get({
          presentationId: PRESENTATION_ID
        }).then(function(response) {
          var presentation = response.result;
          var length = presentation.slides.length;

          issueEvent(document, "slideInfo", presentation.slides);

          /*
          for (i = 0; i < length; i++) {
            var slide = presentation.slides[i];

            console.log(slide);

            $("#slideContents").append("<div>" + 
                    "------ Slide" + (i+1) + " : " + 

                    slide.objectId + "<br>" + 

                    "</div>");

            for(var j=0;j<slide.pageElements.length;j++) {
                $("#slideContents").append("<div>" + 
                        slide.pageElements[j].objectId + 
                        "</div>");

                if(slide.pageElements[j].shape != undefined) {
                    if(slide.pageElements[j].shape.text != undefined) {
                        for(var k=0;k<slide.pageElements[j].shape.text.textElements.length;k++) {
                            if(slide.pageElements[j].shape.text.textElements[k].textRun != undefined) {
                                $("#slideContents").append("<div>" + 
                                        slide.pageElements[j].shape.text.textElements[k].textRun.content + 
                                        "</div>");
                            }
                        }
                    }
                } 
                else if(slide.pageElements[j].image != undefined) {
                    $("#slideContents").append("<div>" + 
                            slide.pageElements[j].image.contentUrl + 
                            "</div>");
                }
            }
          }*/
        }, function(response) {
          appendPre('Error: ' + response.result.error.message);
        });
      });

      function appendText(objId, myText, pageNumber, startIndex, endIndex, color) {
         console.log("yay");

         gapi.client.request({
            'root': 'https://script.googleapis.com',
            'path': 'v1/scripts/16qbV0EOaVfKQhEw7d3Ug9Wc87ShtQ5PuJoYB0GQumeh9s08TYQHTTUah:run',
            'method': 'POST',
            'body': {
                'function': 'myFunction',
                'parameters': null,
                'devMode': false 
            }
         }).then((response) => {
             console.log("cool!");
             console.log(response);
         }).catch(function(error) {
             console.log('cache!');
             console.log(error);
         });

         var requests = [ 
         {
           "insertText": {
             "objectId": objId,
             "text": myText + '\n',
             "insertionIndex": 987987987
           }
         } ];
     
         gapi.client.slides.presentations.batchUpdate({
           presentationId: PRESENTATION_ID,
           requests: requests
         }).then((createSlideResponse) => {
             console.log("strange");
             console.log(createSlideResponse);
         }).catch(function(error) {
             console.log('cache!');
             console.log(error);
     
             if(error.result.error.code == 400) { // get the end index

                 var errorMessage = error.result.error.message;

                 var flag = false;
                 var result = 0, pow = 1;

                 for(var i=errorMessage.length-1;i>=0;i--) {
                    if(errorMessage[i] == ')') {
                       flag = true;
                    }
                    else if(errorMessage[i] == '(') break;
                    else {
                        if(flag == true) {
                            result = result + pow * parseInt(errorMessage[i]);
                            pow *= 10;
                        }
                    }
                 }

                 var requests = [ {
                   "insertText": {
                     objectId: objId,
                     text: (result == 0 ? myText : '\n' + myText),
                     insertionIndex: result
                   },
                 } ];
    
                 gapi.client.slides.presentations.batchUpdate({
                   presentationId: PRESENTATION_ID,
                   requests: requests
                 }).then((createSlideResponse) => {
                     // successfully pasted the text

                     console.log("succeed!");
                     console.log(createSlideResponse);

                     console.log(color);
                     addHighlight(curPageId, curClickedElements, pageNumber, startIndex, endIndex, color, true);

                     issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                             {
								"pageNumber": pageNumber,
                                "startIndex": startIndex,
                                "endIndex": endIndex,
                                "color": color,
                             });
                     });
                 }
         });
      }

      function removeHighlight(pageId, objId, startIdx, endIdx) {
          // to be filled
      }

      function fillText(objId, myText, pageNumber, startIndex, endIndex, color) {
         var requests = [ 
             /*
         {
           "deleteText": {
             objectId: objId,
           }
         },*/
         {
           "insertText": {
             "objectId": objId,
             "text": myText + '\n',
           }
         } ];
     
         gapi.client.slides.presentations.batchUpdate({
           presentationId: PRESENTATION_ID,
           requests: requests
         }).then((createSlideResponse) => {
             console.log("succeed!");
             console.log(createSlideResponse);

             addHighlight(curPageId, ["editor-" + objId], pageNumber, startIndex, endIndex, color, true);

             issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                     {
						"pageNumber": pageNumber,
                        "startIndex": startIndex,
                        "endIndex": endIndex,
                        "color": color,
             });
         }).catch(function(error) {
             console.log('cache!');
             console.log(error);
         });
      }

      function addText(objId, pageId, myText, pageNumber, startIndex, endIndex, color) {
          console.log(color);

          if(objId != null) {
              appendText(objId, myText, pageNumber, startIndex, endIndex, color);
           }
          else{
             var newObjId = createObjId();

             var requests = [ 
             {
               "createShape": {
                   "objectId": newObjId,
                   "shapeType": "TEXT_BOX",
                   "elementProperties": {
                       "pageObjectId": pageId,
                       "size": {
                           "width": {
                               "magnitude": 350,
                               "unit": "PT"
                           },
                           "height": {
                               "magnitude": 350,
                               "unit": "PT"
                           }
                       },
                       "transform": {
                           "scaleX": 1,
                           "scaleY": 1,
                           "translateX": 0,
                           "translateY": 0,
                           "unit": "PT"
                       }
                   }
               }
             }];

             console.log(requests);

             gapi.client.slides.presentations.batchUpdate({
               presentationId: PRESENTATION_ID,
               requests: requests
             }).then((createSlideResponse) => {
                 fillText(newObjId, myText, pageNumber, startIndex, endIndex, color);
             });
          }
      }

      $("#insertText").on("click", function() {
              addText("SLIDES_API1293859000_1", "blahblah");
     });

    $(document).on("highlighted", function(details){
            console.log(details);

            console.log("I got this");
    });

    $(document).on("ADDTEXT_COMPLETED", function(e) {
            console.log(e.details);
    });

    $(document).on("clearPlaneCanvas", function(e) {
            $(".slidePlaneCanvasHighlight").remove();
    });

    $(document).on("highlightSlideObject", function(e) {
            $("#slidePlaneCanvas").append(
                    '<div style="' + 
                    'position: absolute; ' + 
                    'width: ' + e.detail.width + '; ' + 
                    'height: ' + e.detail.height + '; ' + 
                    'left: ' + e.detail.left+ '; ' + 
                    'top: ' + e.detail.top + '; ' +
                    'background-color: yellow;' + 
                    'opacity: 0.2" class="slidePlaneCanvasHighlight">' + 
                    '</div>'
                    );
    });

    $(document).on("ROOT_UPDATE_HIGHLIGHT_REQUEST", function(e) {
        var p = e.detail;

        updateHighlight(p.pageId, p.objIdList);
    });

	$(document).on("SEND_IMAGE", function(e) {
		p = e.detail;

	    var requests = [ {
		   "createImage": {
		     "url": p.imageURL,
		     "elementProperties": {
		   	  "pageObjectId": curPageId,
		     }
		   },
	    } ];
	    
	    gapi.client.slides.presentations.batchUpdate({
	      presentationId: PRESENTATION_ID,
	      requests: requests
	    }).then((createSlideResponse) => {
	        // successfully pasted the text
	
	        console.log("succeed!");
	        console.log(createSlideResponse);
	    });
	});

    $(document).on("UPDATE_SLIDE_INFO", function(e) {
        var p = e.detail;

        var slideId = p.pageId;
        getPageInfo(slideId);
    });

    $(document).on("ROOT_UPDATE_CUR_PAGE_AND_OBJECTS", function(e) {
        var p = e.detail;

        curPageId = p.pageId;
        curClickedElements = p.clickedElements
/*
        console.log(curPageId);
        console.log(curClickedElements);
        */
    });

    $(document).on("showAutoComplete", function(e) {
        var p = e.detail;

        $("#slidePlaneCanvasPopup").css("left", p.left);
        $("#slidePlaneCanvasPopup").css("top", p.top);
    });

    $(document).on("clearVisualizeParagraph", function(e) {
            $(".slideVisualizeParagraph").remove();
    });

    $(document).on("visualizeParagraph", function(e) {
        var p = e.detail;

        if($(".slideVisualizeParagraph").length > 0) {
            console.log("re draw!");
            $(".slideVisualizeParagraph").css("left", e.detail.left);
            $(".slideVisualizeParagraph").css("top", e.detail.top);
            $(".slideVisualizeParagraph").width(e.detail.width);
            $(".slideVisualizeParagraph").height(e.detail.height);
        }
        else {
            $("#slidePlaneCanvas").append(
                    '<div style="' + 
                    'position: absolute; ' + 
                    'width: ' + e.detail.width + '; ' + 
                    'height: ' + e.detail.height + '; ' + 
                    'left: ' + e.detail.left+ '; ' + 
                    'top: ' + e.detail.top + '; ' +
                    'border: 2px dotted black' + 
                    '" class="slideVisualizeParagraph">' + 
                    '</div>'
                    );
        }
    });
/*
	readTextFile("./generic/web/metadata.tei", 'xml');
	readTextFile("./generic/web/metadata.json", 'json');
*/
	
    $(document).on("click", "#outlinePlaneContent", function(e){
        var x = e.clientX, y = e.clientY;
        var elementMouseIsOver = document.elementFromPoint(x, y);

        console.log("clicked!");
        console.log($(elementMouseIsOver));

        $(".outlineLineEditor").each(function(index) {
            $(this).css("background-color", "white");
        });

        if($(elementMouseIsOver).hasClass("outlineLineEditor")) {
           $(elementMouseIsOver).css("background-color", "yellow");
        }
    });

    // putNewOutlineLine(0, 0, "blah");

    windowsHeight = $(window).height();
    windowsWidth = $(window).width();

    console.log(windowsHeight);
    console.log(windowsWidth);

    $("#leftPlane").height(windowsHeight-1);
    $("#slidePlane").height(windowsHeight-1);

    $("#wrapper").width(windowsWidth-1);

    /*
    $(document).on('keydown', '.outlineLineEditor', function(e) {
            var curIndex = parseInt($(this).attr("id").split("_")[1]);
            var curLevel = outlineInfo[curIndex].level;

            if(e.keyCode == 13) { // Enter
                $(".outlineLineEditor").each(function(index) {
                    $(this).css("background-color", "white");
                });

                var newIndex = curIndex + 1;

                putNewOutlineLine(newIndex, curLevel, '');

                $("#outlineLineEditor_" + newIndex).focus();
                $("#outlineLineEditor_" + newIndex).css("background-color", "yellow");

                return false;
            }
            else if(e.keyCode == 9) { // Tab
                if(e.shiftKey && outlineInfo[curIndex].level > 0) decreaseLevel(curIndex);
                else if(!e.shiftKey && curIndex > 0 && outlineInfo[curIndex-1].level >= outlineInfo[curIndex].level) increaseLevel(curIndex);

                return false;
            }
            else if(e.keyCode == 8 && getTextInEditor(curIndex) == '') { // Back space
                if(curIndex == outlineInfo.length-1) {
                    removeOutlineLine(curIndex);
                    $("#outlineLineEditor_" + (curIndex-1)).focus();
                }
                else if(outlineInfo.length > 1){
                    removeOutlineLine(curIndex);
                    $("#outlineLineEditor_" + (curIndex)).focus();
                }
            }
            else if(e.keyCode == 38) { // Upper arrow
                $(".outlineLineEditor").each(function(index) {
                    $(this).css("background-color", "white");
                });

                var prevIndex = curIndex-1;

                if(prevIndex >= 0){
                    $("#outlineLineEditor_" + prevIndex).focus();

                    if($("#outlineLineEditor_" + prevIndex).hasClass("outlineLineEditor")) {
                       $("#outlineLineEditor_" + prevIndex).css("background-color", "yellow");
                    }
                }
            }
            else if(e.keyCode == 40) { // Lower arrow
                $(".outlineLineEditor").each(function(index) {
                    $(this).css("background-color", "white");
                });

                var nextIndex = curIndex+1;

                if(nextIndex < outlineInfo.length){
                    $("#outlineLineEditor_" + nextIndex).focus();

                    if($("#outlineLineEditor_" + nextIndex).hasClass("outlineLineEditor")) {
                       $("#outlineLineEditor_" + nextIndex).css("background-color", "yellow");
                    }
                }
            }

            else return true;
            });
            */

    Split(['#leftPlane', '#slidePlane'], {
        sizes: [50, 50],
        minSize: 0
    });

    $(window).resize(function() {
        windowsHeight = $(window).height();
        windowsWidth = $(window).width();

        $("#leftPlane").height(windowsHeight-1);
        $("#slidePlane").height(windowsHeight-1);
        $("#wrapper").width(windowsWidth-1);

        $("#outlineLineEditor1").css("padding-left", $("#outlineLineBullet1").width);
    });

    function refSuccess(e) {
        console.log(e);
    }

    $.ajax({
url: "https://api.crossref.org/works?rows=5&query.title=Trace-based+Just-in-Time+Type+Specialization+for+Dynamic+Languages",
success: refSuccess,
dataType: "json"
            });

    myDB = new PouchDB('doc2slide_db')

    clearDatabase();
    loadData();
});

