var PRESENTATION_ID = '11Vza3FSJS7mq6CSOfHPpsF77pyGDSaVs8R5zQyNogL4'
var documentString;

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

function readTextFile(file)
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
            }
        }
    }
    rawFile.send(null);
}

$(document).ready(function() {
      // Client ID and API key from the Developer Console
      var CLIENT_ID = '1080216621788-nsdlr416il84hr9t6nkrb9fv3b663tgk.apps.googleusercontent.com';
      var API_KEY = 'AIzaSyDtDPjTzXFIxzaYwz-qyaHAty-16vCNOJo';

      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://slides.googleapis.com/$discovery/rest?version=v1"];

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      var SCOPES = "https://www.googleapis.com/auth/presentations";

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

      handleClientLoad();

      $("#createSlideButton").on("click", function() {
        createSlide();
        listSlides();
      });
	
      $(document).on("addText", function(e) {
          console.log(e);
          addText(e.detail.objId, e.detail.text, e.detail.pageId);
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

	  function createObjId() {
		  var text = "";
		  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		  for (var i = 0; i < 20; i++)
			  text += possible.charAt(Math.floor(Math.random() * possible.length));

		  return text;
	  }

      function fillText(objId, myText) {
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
         }).catch(function(error) {
             console.log('cache!');
             console.log(error);
     
             var requests = [ {
               "insertText": {
                 objectId: objId,
                 text: myText
               }
             } ];
     
             gapi.client.slides.presentations.batchUpdate({
               presentationId: PRESENTATION_ID,
               requests: requests
             }).then((createSlideResponse) => {
                 console.log("succeed!");
                 console.log(createSlideResponse);
                 });
         });
      }

      function addText(objId, myText, pageId) {
          if(objId != null) {
              fillText(objId, myText);
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
                 fillText(newObjId, myText);
             });
          }
      }

      $("#insertText").on("click", function() {
              addText("SLIDES_API1293859000_1", "blahblah");
     });

	$(document).on('click', '.highlightPhrase', function() {
		alert($(this).attr('id'));
	});

    $(document).on("highlighted", function(details){
            console.log(details);

            console.log("I got this");
    });
});
