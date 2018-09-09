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
          // listSlides();

          // callAppsScript(gapi.auth2.getAuthInstance());
			listFiles();
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

    /**
       * Print files.
       */
      function listFiles() {
			console.log(" *** I am in the listfiles *** ");
        gapi.client.drive.files.list({
          'pageSize': 10,
          'fields': "nextPageToken, files(id, name)"
        }).then(function(response) {
			console.log(response);
/*
          appendPre('Files:');
          var files = response.result.files;
          if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
              var file = files[i];
              appendPre(file.name + ' (' + file.id + ')');
            }
          } else {
            appendPre('No files found.');
          }*/
        }).catch((error) => {
          // The API encountered a problem.
			console.log(error);
          return console.log(`The API returned an error: ${error}`);
        });
      }


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

      function getPageInfo(presentationId, pageId) {
        gapi.client.slides.presentations.pages.get({
          presentationId: presentationId,
          pageObjectId: pageId
        }).then(function(response) {
            console.log(response);
        }, function(response) {
          appendPre('Error: ' + response.result.error.message);
        });
      }

      function listSlides() {
        gapi.client.slides.presentations.get({
          presentationId: PRESENTATION_ID
        }).then(function(response) {
          var presentation = response.result;
          var length = presentation.slides.length;
          appendPre('The presentation contains ' + length + ' slides:');
          for (i = 0; i < length; i++) {
            var slide = presentation.slides[i];
            appendPre('- Slide #' + (i + 1) + ' contains ' +
                slide.pageElements.length + ' elements.');
            console.log(slide);

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

function storeData(pageId, objIdList, pageNumber, startIdx, endIdx) {
    for(var i=0;i<objIdList.length;i++) {
        myDB.put({
          "_id": createObjId(),
          "userId": userID,
          "documentId": documentID,
          "pageId": pageId,
          "objId": objIdList[i],
		  "pageNumber": pageNumber,
          "startIdx": startIdx,
          "endIdx": endIdx
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
             addHighlight(elem.pageId, [elem.objId], elem.pageNumber, elem.startIdx, elem.endIdx, false);
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

function addHighlight(pageId, objIdList, pageNumber, startIdx, endIdx, flag) {
    if(!(pageId in highlightDictionary)) {
        highlightDictionary[pageId] = {};
    }

    for(var i=0;i<objIdList.length;i++) {
        objId = objIdList[i];

        if(!(objId in highlightDictionary[pageId])) {
            highlightDictionary[pageId][objId] = [];
        }

        highlightDictionary[pageId][objId].push([pageNumber, startIdx, endIdx]);
    }

    if(flag)
        storeData(pageId, objIdList, pageNumber, startIdx, endIdx);
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

          issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                  {
					"pageNumber": pageNumber,
                     "startIndex": startIdx,
                     "endIndex": endIdx,
                     "slideObjId": thisKey,
                     "color": (objIdList.includes(thisKey) ? 'blue' : 'yellow'),
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

$(document).ready(function() {
       initializeGAPI();

      $("#createSlideButton").on("click", function() {
        createSlide();
        listSlides();
      });
	
      $(document).on("addText", function(e) {
          console.log(e);

          addText(e.detail.objId, e.detail.pageId, e.detail.text, e.detail.pageNumber, e.detail.startIndex, e.detail.endIndex);
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

      function appendText(objId, myText, pageNumber, startIndex, endIndex) {
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

                     addHighlight(curPageId, curClickedElements, pageNumber, startIndex, endIndex, true);

                     issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                             {
								"pageNumber": pageNumber,
                                "startIndex": startIndex,
                                "endIndex": endIndex,
                                "color": 'yellow',
                             });
                     });
                 }
         });
      }

      function removeHighlight(pageId, objId, startIdx, endIdx) {
          // to be filled
      }

      function fillText(objId, myText, pageNumber, startIndex, endIndex) {
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

             addHighlight(curPageId, ["editor-" + objId], pageNumber, startIndex, endIndex, true);

             issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                     {
						"pageNumber": pageNumber,
                        "startIndex": startIndex,
                        "endIndex": endIndex,
                        "color": 'yellow',
             });
         }).catch(function(error) {
             console.log('cache!');
             console.log(error);
         });
      }

      function addText(objId, pageId, myText, pageNumber, startIndex, endIndex) {
          if(objId != null) {
              appendText(objId, myText, pageNumber, startIndex, endIndex);
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
                 fillText(newObjId, myText, pageNumber, startIndex, endIndex);
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
            $("#slidePlaneCanvas").html('');
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
                    'opacity: 0.2">' + 
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

    $(document).on("ROOT_UPDATE_CUR_PAGE_AND_OBJECTS", function(e) {
        var p = e.detail;

        curPageId = p.pageId;
        curClickedElements = p.clickedElements
/*
        console.log(curPageId);
        console.log(curClickedElements);
        */
    });
/*
	readTextFile("./generic/web/metadata.tei", 'xml');
	readTextFile("./generic/web/metadata.json", 'json');
*/
	
    windowsHeight = $(window).height();
    windowsWidth = $(window).width();

    console.log(windowsHeight);
    console.log(windowsWidth);

    $("#leftPlane").height(windowsHeight-1);
    $("#outlinePlane").height(windowsHeight-1);
    $("#slidePlane").height(windowsHeight-1);

    $("#wrapper").width(windowsWidth-2);

    Split(['#leftPlane', '#outlinePlane', '#slidePlane'], {
        sizes: [33, 33, 34],
        minSize: 200
    });

    $(window).resize(function() {
        windowsHeight = $(window).height();
        windowsWidth = $(window).width();

        $("#leftPlane").height(windowsHeight-1);
        $("#outlinePlane").height(windowsHeight-1);
        $("#slidePlane").height(windowsHeight-1);

        $("#wrapper").width(windowsWidth-2);
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

