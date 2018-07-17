var PRESENTATION_ID = '11Vza3FSJS7mq6CSOfHPpsF77pyGDSaVs8R5zQyNogL4'

function issueEvent(object, eventName, data) {
    var myEvent = new CustomEvent(eventName, {detail: data} );

    // window.postMessage(eventName, "*");

    object.dispatchEvent(myEvent);
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
                
                $("#leftPlane").append("<pre id='documentText'>" + allText + "</pre>");
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
          signoutButton.style.display = 'block';
          // listSlides();
        } else {
          authorizeButton.style.display = 'block';
          signoutButton.style.display = 'none';
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
      function appendPre(message) {
        var pre = document.getElementById('content');
        var textContent = document.createTextNode(message + '\n');
        pre.appendChild(textContent);
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

      function addText(objId, myText) {
        var requests = [{
          insertText: {
            objectId: objId,
            text: myText
          }
        }];
        
        // If you wish to populate the slide with elements, add element create requests here,
        // using the pageId.
        
        // Execute the request.

        gapi.client.slides.presentations.batchUpdate({
          presentationId: PRESENTATION_ID,
          requests: requests
        }).then((createSlideResponse) => {
            console.log("succeed!");
            console.log(createSlideResponse);
        });
      }

      $("#insertText").on("click", function() {
              addText("SLIDES_API1293859000_1", "blahblah");
     });

     readTextFile("./document.txt");

});
