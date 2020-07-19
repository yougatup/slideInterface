var pageCanvasDebugging = false;
var bodyRegisterAsWell = false;

var subtitleStyle = null;
var PRESENTATION_ID = '1-ZGwchPm3T31PghHF5N0sSUU_Jd9BTwntcFf1ypb8ZY'
var documentString;
var highlightDictionary = {};
var curPageId = null;
var curClickedElements = [];
var curParagraphs = [];
var myDB;
var jsonMetaData, xmlMetaData;
var tei, json;
var userID, documentID;
var windowsHeight, windowsWidth;
var outlineInfo = [];
var slideInfo = [];
var currentAutoCompleteInstances = [];
var dataLoaded = false;

var initialSlideGenerationFlag = false;
var removedSlideCnt, initialSlideCnt, createdSlideCnt, sectionCnt, filledSectionCnt;

var autoCompleteFlag = false;
var segmentDatabase = {};
var paragraphTable = {};

var sectionStructure, paperTitle, paperAuthors;
var sectionParagraph;
var autoCompleteStatus = false;
var autoCompleteObjID = null;
var autoCompleteParagraphNumber = null;
var autoCompleteParagraphIdentifier = null;
var non_autoCompleteParagraphIdentifier = null;
var autoCompletePageID = null;

var replaceFlag = false;
var replaceParagraphNumber = -1;
var curNavigationElement = null;
var curAutocompleteRow = null;

var isMappingIdentifierDragging = false;

var typeDictionary = {};
var originalTextDictionary = {};

var ignoreString = [
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours ", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "return", "aren't", "can't", "couldn't", "didn't", "doesn't", "don't", "hadn't", "hasn't", "haven't", "hes", "heres", "hows", "im", "isn't", "its", "lets", "mustn't", "shant", "shes", "shouldn't", "thats", "theres", "they'll", "they're", "they've", "wasn't", "were", "weren't", "what's", "whens", "wheres", "whos", "whys", "won't", "wouldn't", "you'd", "you'll", "you're", "you've"
];

Array.prototype.insert = function ( index, item ) {
        this.splice( index, 0, item );
};

Array.prototype.remove= function ( index ) {
        this.splice( index, 1 );
};

function issueEvent(object, eventName, data) {
    // console.log(eventName);
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

function listSlides(callback) {
    gapi.client.slides.presentations.get({
	presentationId: PRESENTATION_ID
    }).then(function(response) {
	console.log("hmm?");
	$("#outlinePlaneContent").text('');

	console.log(response.result);
	
	var presentation = response.result;
	var length = presentation.slides.length;

	slideInfo = [];

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
	}

	console.log(slideInfo);

	if(callback) {
	    callback();
	}

    }, function(response) {
	console.log(response);
	//appendPre('Error: ' + response.result.error.message);
    }).catch(function(er) {
	console.log("WHAT?");
	console.log(er);
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
      var CLIENT_ID = '242873078831-sdfm9eu5qcvoek4k0vkq9ef7de0vqf0a.apps.googleusercontent.com';

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
          console.log("signed in!");
          listSlides(null);

	  console.log("here1");

	  console.log(initialSlideGenerationFlag);
/*
	  if(initialSlideGenerationFlag) {
	      initialSlideCreationStart();
	  }*/

	  console.log("done!");
          // callAppsScript(gapi.auth2.getAuthInstance());

	  console.log("HELLO!");
	  console.log(slideInfo);

	  console.log(gapi.client.slides);

	  if(gapi.client.slides == null) {
	      initialSlideGenerationFlag = true;
	      initialSlideCreationStart();
	  }
	  else {
	      // already loaded. Let's remove

	      console.log("Already loaded. Let's remove");

	      initialSlideCreationStart();
	  }
	} else {
	    authorizeButton.style.display = 'block';
	    // signoutButton.style.display = 'none';
	    console.log("yay?");
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

function sendSlideInfoToPDF() {
    console.log("SEND SLIDE INFO TO PDF");

    issueEvent(document, "sendSlideInfoToPDF", slideInfo);
}

function removeAllSlides() {
   gapi.client.slides.presentations.get({
     presentationId: PRESENTATION_ID
   }).then(function(response) {
     console.log("hmm?");
     console.log(response);
   }).catch(function (err) {
     console.log(err);
   });
}

function fillSectionTitles() {
   gapi.client.slides.presentations.get({
     presentationId: PRESENTATION_ID
   }).then(function(response) {
     console.log(response);

     var slides = response.result.slides;

     sectionCnt = sectionStructure.length;
     filledSectionCnt = 0;

     for(var i=1;i<slides.length;i++) {
	 var slideTitleID = slides[i].pageElements[0].objectId;
	 var slideBodyID = slides[i].pageElements[1].objectId;

	 // 	 putStringToObj(slideTitleID, sectionStructure[i-1].text);
	 
	 console.log(sectionStructure);
	 console.log(sectionParagraph);
	 console.log(slideBodyID);

	 if(bodyRegisterAsWell) {
	     var bodyString = '';

	     for(var j=0;j<sectionParagraph[i-1].length;j++){
		 if(j != 0) bodyString = bodyString + '\n';

		 bodyString = bodyString + '* ' + sectionParagraph[i-1][j].text.split(".")[0];
	     }
	 }

	 var requests;

	 if(bodyRegisterAsWell) {
	     requests = [{
		 insertText: {
		     "objectId": slideTitleID,
		     "text": sectionStructure[i-1].text,
		 }
	     },
		 {
		     insertText: {
			 "objectId": slideBodyID,
			 "text": bodyString,
		     }
		 }];
	 }
	 else {
	     requests = [{
		 insertText: {
		     "objectId": slideTitleID,
		     "text": sectionStructure[i-1].text,
		 }
	     }];
	 }

	 gapi.client.slides.presentations.batchUpdate({
	     presentationId: PRESENTATION_ID,
	     requests: requests
	 }).then((createSlideResponse) => {
	     // successfully pasted the text

	     filledSectionCnt++;

	     console.log("succeed!");
	     console.log(createSlideResponse);

	     if(filledSectionCnt >= sectionCnt) {
		 googleSlideReady();
	     }
	 });
     }
   }).catch(function (err) {
       console.log(err);
   });
}

function googleSlideReady() {
    // $("#slideIframe").attr("src", "https://docs.google.com/presentation/d/1-ZGwchPm3T31PghHF5N0sSUU_Jd9BTwntcFf1ypb8ZY/edit");

    listSlides(sendSlideInfoToPDF);
}

function initialSlideCreationStart() {
    console.log("here am I");
   gapi.client.slides.presentations.get({
     presentationId: PRESENTATION_ID
   }).then(function(response) {
     console.log(response);

     var slides = response.result.slides;

     initialSlideCnt = slides.length;
     removedSlideCnt = 0;

     for(var i=0;i<slides.length;i++) {
	var pageID = slides[i].objectId;

	var requests = [ {
	    "deleteObject": {
		"objectId": pageID,
	    },
	}];

	gapi.client.slides.presentations.batchUpdate({
	    presentationId: PRESENTATION_ID,
	    requests: requests
	}).then((createSlideResponse) => {
	    // successfully pasted the text

	    console.log("succeed!");
	    console.log(createSlideResponse);

	    removedSlideCnt++;

	    if(removedSlideCnt >= initialSlideCnt) {
		initialSlideCreation();
	    }
	});
     }
   }).catch(function (err) {
     console.log(err);
   });

  // googleSlideReady();
}

function initialSlideCreation() {
    var firstSlideObjID = createObjId();
    var requests = [{
	createSlide: {
	    objectId: firstSlideObjID,
	    insertionIndex: '0',
	    slideLayoutReference: {
	       predefinedLayout: 'TITLE'
	    }
	}
    }];

    gapi.client.slides.presentations.batchUpdate({
	presentationId: PRESENTATION_ID,
	requests: requests
    }).then((createSlideResponse) => {
	// successfully pasted the text

	console.log("succeed!");
	console.log(createSlideResponse);

        gapi.client.slides.presentations.pages.get({
          presentationId: PRESENTATION_ID,
          pageObjectId: firstSlideObjID 
        }).then(function(response) {
            console.log(response);

	    for(var i=0;i<response.result.pageElements.length;i++) {
		var elemID = response.result.pageElements[i].objectId;

		if(i == 0) { // title
		    putStringToObj(elemID, paperTitle);
		}
		else {
		    putStringToObj(elemID, paperAuthors.join('\n'));
		}
	    }
		
	    createdSlideCnt = 0;
	    for(var j=0;j<sectionStructure.length;j++){
		var sectionObjID = createObjId();
		var requests = [{
		    createSlide: {
			objectId: sectionObjID,
	    		insertionIndex: '1',
			slideLayoutReference: {
			    predefinedLayout: 'TITLE_AND_BODY'
			}
		    }
		}];

		gapi.client.slides.presentations.batchUpdate({
		    presentationId: PRESENTATION_ID,
		    requests: requests
		}).then((createSlideResponse) => {
		    // successfully pasted the text

		    console.log("succeed!");
		    console.log(createSlideResponse);

		    createdSlideCnt++;

		    if(createdSlideCnt >= sectionStructure.length) {
			fillSectionTitles();
		    }
/*
		    var pageID = createSlideResponse.result.replies[0].createSlide.objectId;

		    gapi.client.slides.presentations.pages.get({
			presentationId: PRESENTATION_ID,
			pageObjectId: pageID
		    }).then(function(response) {
			console.log(response);

			var thisPageID = response.result.objectId;
			var titleElemID = response.result.pageElements[0].objectId;
			var index = parseInt(thisPageID.split("_")[1]);

			console.log(titleElemID, sectionStructure[index].text);

			putStringToObj(titleElemID, sectionStructure[index].text);

			// makeSectionSlide(structure.slice(1), index+1);
		    }, function(response) {
			console.log(response);
		    });*/
		});
	    }

	    // makeSectionSlide(sectionStructure, 1);

        }, function(response) {
	    console.log(response);
        });
    });
}

function sendSectionTitleToExtension() {
    console.log(sectionStructure);

    issueEvent(document, "root_sendSectionTitleToExtension", {
	sectionStructure: sectionStructure
    });
}

function makeSectionSlide(structure, index) {
    if(structure.length <= 0) return;

    var sectionObjID = createObjId();
    var requests = [{
	createSlide: {
	    objectId: sectionObjID,
	    insertionIndex: index,
	    slideLayoutReference: {
	       predefinedLayout: 'TITLE_AND_BODY'
	    }
	}
    }];

    gapi.client.slides.presentations.batchUpdate({
	presentationId: PRESENTATION_ID,
	requests: requests
    }).then((createSlideResponse) => {
	// successfully pasted the text

	console.log("succeed!");
	console.log(createSlideResponse);

        gapi.client.slides.presentations.pages.get({
          presentationId: PRESENTATION_ID,
          pageObjectId: sectionObjID 
        }).then(function(response) {
            console.log(response);

	    var titleElemID = response.result.pageElements[0].objectId;

	    putStringToObj(titleElemID, structure[0]);
		
	    makeSectionSlide(structure.slice(1), index+1);
        }, function(response) {
	    console.log(response);
        });
    });
}

function putStringToObj(objID, str) {
    var requests = [{
	insertText:   {
	    "objectId": objID,
	  "text": str,
	}
    }];

    gapi.client.slides.presentations.batchUpdate({
	presentationId: PRESENTATION_ID,
	requests: requests
    }).then((createSlideResponse) => {
	// successfully pasted the text

	console.log("succeed!");
	console.log(createSlideResponse);
    });
}

function storeData(pageId, objIdList, pageNumber, paragraphIdentifier, startIdx, endIdx, color) {
    for(var i=0;i<objIdList.length;i++) {
        myDB.put({
          "_id": createObjId(),
          "type": "highlight",
          "userId": userID,
          "documentId": documentID,
          "pageId": pageId,
          "objId": objIdList[i],
		  "pageNumber": pageNumber,
          "paragraphIdentifier": paragraphIdentifier,
          "startIdx": startIdx,
          "endIdx": endIdx,
          "color": color
        }).then(function (response) {
          // handle response
            console.log("SUCCEED STORE DATA");

            // loadData();
        }).catch(function (err) {
          console.log(err);
        });
    }
}


function getParagraphIdentifier(objId, paragraphNumber) {
    if(paragraphTable[objId] == null) return null;
    if(paragraphTable[objId].length <= paragraphNumber) return null;

    return paragraphTable[objId][paragraphNumber];
}

function registerMapping(objId, paragraphNumber, paragraphId, flag) {
    //console.log("REGISTER MAPPING");
    console.log(objId, paragraphNumber, paragraphId, flag);

    if(paragraphTable[objId] == null) {
        paragraphTable[objId] = [];
    }

    if(paragraphTable[objId].length <= paragraphNumber) {
        var curLength = paragraphTable[objId].length;

        for(i=curLength;i<=paragraphNumber;i++) {
            paragraphTable[objId].push(null);
        }
    }

    paragraphTable[objId][paragraphNumber] = paragraphId;

    if(flag) {
	myDB.put({
	    "_id": createObjId(),
	    "type": "paragraphMapping",
	    "objId": objId,
	    "paragraphNumber": paragraphNumber,
	    "paragraphId": paragraphId
	}).then(function (response) {
	    // handle response
	    console.log("SUCCEED STORE DATA");

	    // loadData();
	}).catch(function (err) {
	    console.log(err);
	});
    }

    issueEvent(document, "root_getSectionHierarchyStructure", {
	highlightDictionary: highlightDictionary
    });
}

function removeMapping(mappingId) {

}

function loadData() {
	myDB.allDocs({
	  include_docs: true,
	  attachments: true
	}).then(function (result) {
      var flag = false;
	  console.log(result);
/*
      var paragraphIDDictionary = {};

      for(var i=0;i<result.rows.length;i++) {
         var elem = result.rows[i].doc;

         if(elem.type == 'paragraphMapping') {
              registerMapping(elem.objId, elem.paragraphNumber, elem.paragraphId, false);

              paragraphIDDictionary[elem.paragraphId] = true;
         }
      }

      for(var i=0;i<result.rows.length;i++) {
         var elem = result.rows[i].doc;

         if(elem.type == 'highlight') {
            if(elem.userId == userID && elem.documentId == documentID) {
                if(elem.paragraphIdentifier in paragraphIDDictionary) {
                    addHighlight(elem.pageId, [elem.objId], elem.pageNumber, elem.paragraphIdentifier, elem.startIdx, elem.endIdx, elem.color, false);
                }
            }
         }
      }

      console.log("data loaded");
      console.log(highlightDictionary);
      console.log(paragraphTable);
*/
      dataLoaded = true;

      if(flag) {
        updateHighlight(curPageId, [], null);
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

function removeHighlight(pageID, boxID, mappingIdentifiers, lastElemIndex, pageNumber, startIndex, endIndex) {
    // to be filled

    if(pageID == null) {
    	var keys = Object.keys(highlightDictionary);
	console.log(highlightDictionary);

	for(var k=0;k<mappingIdentifiers.length;k++) {
       	    var myKey = boxID + '-paragraph-' + mappingIdentifiers[k];
	    console.log("myKey");
	    console.log(myKey);
	    console.log(keys);

	    for(var i=0;i<keys.length;i++) {
		var keys2 = Object.keys(highlightDictionary[keys[i]]);
		console.log(keys2);

		for(var j=0;j<keys2.length;j++) {
		    console.log(keys2[j]);
		    if(keys2[j] == myKey) {
			pageID = keys[i];
			break;
		    }
		}
		if(pageID != null) {
		    break;
		}
	    }

	    if(pageID != null) {
		break;
	    }
	}
    }
    else if(highlightDictionary[pageID] == null) return;

    console.log(pageID);

    for(var i=0;i<mappingIdentifiers.length;i++) {
        var key = boxID + '-paragraph-' + mappingIdentifiers[i];
        console.log(key);

        if(highlightDictionary[pageID][key] == null){
            console.log("cannot find key " + key);
        }
        else {
	    if(pageNumber == null) {
            	delete highlightDictionary[pageID][key];
	    }
	    else {
		console.log("cool!");
		console.log(highlightDictionary);
		console.log(pageID, key, pageNumber, startIndex, endIndex);

		if(highlightDictionary[pageID][key].length == 1 && 
		   highlightDictionary[pageID][key][0][0] == pageNumber && 
		   highlightDictionary[pageID][key][0][1] == startIndex && 
		   highlightDictionary[pageID][key][0][2] == endIndex) {
		    delete highlightDictionary[pageID][key];
		}
		else {
		    for(var j=0;j<highlightDictionary[pageID][key].length;j++) {
			if(highlightDictionary[pageID][key][j][0] == pageNumber && 
			    highlightDictionary[pageID][key][j][1] == startIndex && 
			    highlightDictionary[pageID][key][j][2] == endIndex) {
			    highlightDictionary[pageID][key].splice(j, 1);
			    break;
			    }
		    }
		}
	    }

        }
    }

    issueEvent(document, "PDFJS_REMOVE_HIGHLIGHT", null);
    issueEvent(document, "root_displayParagraphsCall", null);

    if(lastElemIndex > -1) {
        for(var i=lastElemIndex;i<30;i++) {
          var key = "paragraph__" + boxID + '-' + i;

//          console.log("remove " + key);

          myDB.get(key).then(function(doc){
                myDB.remove(doc);
          }).catch(function(err) {
            
          });
        }
    }
}

function addHighlight(pageId, objIdList, pageNumber, paragraphIdentifier, startIdx, endIdx, color, flag) {
    // console.log("add highlight called!");

    console.log(objIdList);
    console.log(paragraphIdentifier);
    console.log(pageNumber, startIdx, endIdx);

    if(!(pageId in highlightDictionary)) {
        highlightDictionary[pageId] = {};
    }

    for(var i=0;i<objIdList.length;i++) {
        objId = objIdList[i] + '-paragraph-' + paragraphIdentifier;

        console.log(objId);

        if(!(objId in highlightDictionary[pageId])) {
            highlightDictionary[pageId][objId] = [];
        }

        highlightDictionary[pageId][objId].push([pageNumber, startIdx, endIdx, color]);

    }

    if(flag)
        storeData(pageId, objIdList, pageNumber, paragraphIdentifier, startIdx, endIdx, color);

    issueEvent(document, "root_getSectionHierarchyStructure", {
	highlightDictionary: highlightDictionary
    });
}

function updateHighlight(pageId, objIdList, paragraphIdentifier) {
    console.log(pageId);
    console.log(objIdList);
    console.log(paragraphIdentifier);
    console.log(highlightDictionary);

    // console.log(objIdList);
    // console.log(paragraphNumber);
    // console.log(highlightDictionary);

    var clickedObjKey = null;

    if(objIdList.length > 0 && paragraphIdentifier != null) {
       var objId = objIdList[0].split('-')[1];
       var pNumber = paragraphIdentifier;

       clickedObjKey = objId + '-paragraph-' + pNumber;
       // console.log(clickedObjKey);
       // console.log(highlightDictionary);
    }

    var keys = Object.keys(highlightDictionary);

    for(var i=0;i<keys.length;i++) {
      var thisKey = keys[i];

      var keys2 = Object.keys(highlightDictionary[thisKey]);

      for(var j=0;j<keys2.length;j++) {
	  var thisKey2 = keys2[j];

	  for(var k=0;k<highlightDictionary[thisKey][thisKey2].length;k++) {
	      var pageNumber = highlightDictionary[thisKey][thisKey2][k][0];
	      var startIdx = highlightDictionary[thisKey][thisKey2][k][1];
	      var endIdx = highlightDictionary[thisKey][thisKey2][k][2];
	      var color = highlightDictionary[thisKey][thisKey2][k][3];

	      if(thisKey == pageId && thisKey2 == clickedObjKey) __color = 'green';
	      else if(thisKey == pageId) __color = 'blue';
	      else __color = 'yellow';

	      issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
		      {
			  "pageNumber": pageNumber,
			  "startIndex": startIdx,
			  "endIndex": endIdx,
			  "slideObjId": "editor-" + thisKey2,
			  "color": __color,
		      });
	  }
      }
    }
/*
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
                     "slideObjId": "editor-" + thisKey,
                     "color": (thisKey == clickedObjKey ? 'green' : 'blue'),
          });
      }
    }
    */
}

function clearDatabase() {
    console.log("??");

	myDB.destroy().then(function() {
	    console.log("done!!!!");
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

function prepare() {
    console.log("NOW PREPARE");
       initializeGAPI();

      $("#createSlideButton").on("click", function() {
        createSlide();
        listSlides(null);
      });
	
      function getPageInfo(pageID) {
        gapi.client.slides.presentations.pages.get({
          presentationId: PRESENTATION_ID,
          pageObjectId: pageID
        }).then(function(response) {
            // console.log(response);
        }, function(response) {
          appendPre('Error: ' + response.result.error.message);
        });
      }

      $(document).on("extension_sendStyle", function(e) {
	  var p = e.detail;
	  console.log(p.data);

	  if($("#subtitleTypeBtn").attr("myStyle") == null) {
	      subtitleStyle = p.data;

	      $("#subtitleTypeBtn").attr("myStyle", "initialized");

	      console.log("nice!");
	  }
      });

      $(document).on("extension_getSectionStructure", function(e) {
	  sendSectionTitleToExtension();
      });

      function addToOriginalDictionary(id, s) {
	  if(!(id in originalTextDictionary)) {
	      originalTextDictionary[id] = [];
	  }

	  originalTextDictionary[id].push(s);
      }

      function makeStyle(objID, paragraphNumber, subtitleStyle) {
	  console.log(objID);
	  console.log(paragraphNumber);

	  gapi.client.slides.presentations.pages.get({
	      presentationId: PRESENTATION_ID,
	      pageObjectId: curPageId
	  }).then(function(response) {
	      console.log(response);

	      for(var i=0;i<response.result.pageElements.length;i++) {
		  if(response.result.pageElements[i].objectId == objID) {
		      var text = response.result.pageElements[i].shape.text;
		      var paragraphCnt = 0;

		      console.log(paragraphCnt);

		      for(var j=0;j<text.textElements.length;j++) {
			  console.log(paragraphCnt);

			  if("paragraphMarker" in text.textElements[j]) {
			      paragraphCnt++;
			  }
			  else {
			      console.log(paragraphCnt, paragraphNumber);

			      if(paragraphCnt == parseInt(paragraphNumber)+1) {
				  var startIndex, endIndex;

				  if(text.textElements[j].startIndex == null) startIndex = 0;
				  else startIndex = text.textElements[j].startIndex;

				  endIndex = text.textElements[j].endIndex;

				  console.log(startIndex, endIndex);

				  var requests = [ 
				  {
				      "updateTextStyle": {
					  "objectId": objID,
					  "style": subtitleStyle,
					  "textRange": {
					      "startIndex": startIndex,
					      "endIndex": endIndex,
					      "type": "FIXED_RANGE"
					  },
					  "fields": "*"
				      }
				  }];

				  console.log(requests);

				  gapi.client.slides.presentations.batchUpdate({
				      presentationId: PRESENTATION_ID,
				      requests: requests
				  }).then((createSlideResponse) => {
				      console.log(createSlideResponse);
				  });
			      }
			  }
		      }
		  }
	      }
	  }, function(response) {
	      console.log(response.result.error.message);
	  });
      }

      $(document).on("extension_sendCurParagraphForStyling", function(e) {
	  var p = e.detail;
	  console.log(p);

	  var objID = p.data.objID;
	  var paragraphNumber = p.data.paragraphNumber;

	  makeStyle(objID, paragraphNumber, subtitleStyle);
      });

      $(document).on("registerMappings", function(e) {
	  var p = e.detail;
	  console.log(p);

	  var titleParagraphID = createObjId();
	  registerMapping(p.titleObj, 0, titleParagraphID, true);
	  addToOriginalDictionary(titleParagraphID, p.titleText);

	  for(var i=0;i<parseInt(p.paragraphNumber);i++) {
	      var authorParagraphID = createObjId();
	      registerMapping(p.titleObj2, i, authorParagraphID, true);
	      addToOriginalDictionary(authorParagraphID, p.authorText[i]);
	  }

	  for(var i=0;i<p.sectionObjs.length;i++) {
	      var titleParagraphID = createObjId();
	      registerMapping(p.sectionObjs[i][0], 0, titleParagraphID, true);
	      addToOriginalDictionary(titleParagraphID, p.sectionTitleText[i].text);

	      if(bodyRegisterAsWell) {
		  for(var j=0;j<30;j++) {
		      registerMapping(p.sectionObjs[i][1], j, createObjId(), true);
		  }
	      }
	  }

      });

      $(document).on("extension_disappearMenuButton", function(e) {
	  $("#elementMenuButton").hide();
      });

      $(document).on("extension_setMenu", function(e) {
	  console.log("hello world!");
	  console.log(e.detail);

	  var p = e.detail.data.rect;

	  var paragraphObjID = e.detail.data.curParagraphObjID;
	  var paragraphNumber = e.detail.data.paragraphNumber;
	  var obj_to_push_paragraphNumber = e.detail.data.obj_to_push_paragraphNumber;

	  var objID = paragraphObjID.split("-")[1];

	  var pid = '';

	  if(paragraphNumber == 99) pid = objID + "_figure";
	  else pid = paragraphTable[objID][paragraphNumber];

	  var originalText = originalTextDictionary[pid];

	  console.log(pid);
	  console.log(originalText);

	  console.log(paragraphObjID);
	  console.log(p);

	  // $("#elementMenuButton").show();

	  // $("#elementMenuButton").css("left", p.left);
	  // $("#elementMenuButton").css("top", p.top-80);

	  var orgText = null;

	  if(originalText != null){ 
	      orgText = originalText.join();

	      $("#contentVisualizer").attr("originalText", orgText);
	      $("#originalTextField").html("original text: " + orgText);
	  }
	  else {
	      $("#contentVisualizer").attr("originalText", '');
	      $("#originalTextField").html("original text: ");
	  }


	  $("#contentVisualizer").attr("paragraphNumber", paragraphNumber);
	  $("#contentVisualizer").attr("obj_to_push_paragraphNumber", obj_to_push_paragraphNumber);
	  $("#contentVisualizer").attr("objID", objID);
	  $("#objectIDField").html("object id: " + objID);
      });

      function getTextStyleFromSlideInfo(slideObj, objID, paragraphNumber) {
	  console.log(objID);
	  console.log(paragraphNumber);

	  for(var i=0;i<slideObj.pageElements.length;i++) {
	      console.log(slideObj.pageElements[i]);
	      
	      if(slideObj.pageElements[i].objectId == objID) {
		  var text = slideObj.pageElements[i].shape.text;
		  var paragraphCnt = 0;

		  console.log(text);

		  for(var j=0;j<text.textElements.length;j++) {
		      console.log(text.textElements[j]);
		      console.log(paragraphCnt);

		      if("paragraphMarker" in text.textElements[j]) paragraphCnt++;
		      else {
			  if(paragraphCnt == paragraphNumber+1) {
			      return text.textElements[j].textRun.style;
			  }
		      }
		  }
	      }
	  }

	  return null;
      }

      $(".stylingBtn").on("click", function(e) {
      });

      $("#textTypeBtn").on("click", function(e) {
	  var curText = $("#contentVisualizer").attr("originalText");
	  var clickedObjId = $("#contentVisualizer").attr("objid");
	  var paragraphNumber = $("#contentVisualizer").attr("obj_to_push_paragraphNumber");

	  var obj_to_push = curParagraphs[2].box.split('-')[1];

	  console.log(curText);

	  var pageID = curPageId;

	  console.log(obj_to_push, clickedObjId, pageID, curText);
	  console.log(highlightDictionary);

	  var objKey = clickedObjId + '-paragraph-' + clickedObjId + '_figure';

	  var pageNumber = highlightDictionary[pageID][objKey][0][0];
	  var startIndex = highlightDictionary[pageID][objKey][0][1];
	  var endIndex = highlightDictionary[pageID][objKey][0][2];

	  console.log(obj_to_push, pageID, curText, pageNumber, startIndex, endIndex);

	  var createdParagraphID = createObjId();

	  console.log(createdParagraphID);


	  console.log(curParagraphs[2]);
	  console.log(paragraphNumber);

  	  registerMapping(obj_to_push, paragraphNumber, createdParagraphID, true);
          addText(obj_to_push, pageID, curText, pageNumber, createdParagraphID, startIndex, endIndex, "yellow");

	  removeObject(clickedObjId);
      });
/*
      $("#elementTextButton").on("click", function(e) {
	  var curText = $("#elementMenuButton").attr("originalText");
	  var clickedObjId = $("#elementMenuButton").attr("objid");
	  var paragraphNumber = $("#elementMenuButton").attr("obj_to_push_paragraphNumber");

	  var obj_to_push = curParagraphs[2].box.split('-')[1];

	  console.log(curText);

	  var pageID = curPageId;

	  console.log(obj_to_push, clickedObjId, pageID, curText);
	  console.log(highlightDictionary);

	  var objKey = clickedObjId + '-paragraph-' + clickedObjId + '_figure';

	  var pageNumber = highlightDictionary[pageID][objKey][0][0];
	  var startIndex = highlightDictionary[pageID][objKey][0][1];
	  var endIndex = highlightDictionary[pageID][objKey][0][2];

	  console.log(obj_to_push, pageID, curText, pageNumber, startIndex, endIndex);

	  var createdParagraphID = createObjId();

	  console.log(createdParagraphID);


	  console.log(curParagraphs[2]);
	  console.log(paragraphNumber);

  	  registerMapping(obj_to_push, paragraphNumber, createdParagraphID, true);
          addText(obj_to_push, pageID, curText, pageNumber, createdParagraphID, startIndex, endIndex, "yellow");

	  removeObject(clickedObjId);
      });
      */

      function removeObject(objID) {
	  console.log(objID);

	  var requests = [ 
	  {
	      "deleteObject": {
		  "objectId": objID
	      }
	  }];

	  console.log(requests);

	  gapi.client.slides.presentations.batchUpdate({
	      presentationId: PRESENTATION_ID,
	      requests: requests
	  }).then((createSlideResponse) => {
	      console.log(createSlideResponse);
	  });
      }

      $("#subtitleTypeBtn").on("click", function(e) {
	  if($(this).attr("mystyle") == null) {
	      gapi.client.slides.presentations.pages.get({
		  presentationId: PRESENTATION_ID,
		  pageObjectId: curPageId
	      }).then(function(response) {
		  console.log(response);

		  issueEvent(document, "root_sendStyleCurPage", response.result);
	      }, function(response) {
		  console.log(response.result.error.message);
	      });
	  }
	  else {
	      issueEvent(document, "root_getCurParagraphForStyling", null);
	  }
      });

      $("#figureTypeBtn").on("click", function(e) {
	  $("#searchResultTab").show();

	  var curText = $("#contentVisualizer").attr("originalText");

	  $(".imageQueryResultItem").remove();

	  getImageQueryResult(curText);
      });
/*
      $("#elementFigureButton").on("click", function(e) {
	  $("#searchResultTab").show();

	  var curText = $("#elementMenuButton").attr("originalText");

	  $(".imageQueryResultItem").remove();

	  getImageQueryResult(curText);
      });*/

      $(document).on("click", ".imageQueryResultItem", function() {
	  $("#searchResultTab").hide();

	  console.log(curPageId);

	  console.log($("#contentVisualizer").attr("objID"));
	  console.log($("#contentVisualizer").attr("paragraphNumber"));
	  console.log($("#contentVisualizer").attr("originalText"));

	  var objID = $("#contentVisualizer").attr("objID");
	  var paragraphNumber = $("#contentVisualizer").attr("paragraphNumber");

	  var imageURL = $(this)[0].currentSrc; 

	  console.log(imageURL);
	  console.log($(this));

	  gapi.client.slides.presentations.pages.get({
	      presentationId: PRESENTATION_ID,
	      pageObjectId: curPageId
	  }).then(function(response) {
	      var slideObjs = response.result;

	      console.log(slideObjs);

	      for(var i=0;i<slideObjs.pageElements.length;i++) {
		  if(slideObjs.pageElements[i].objectId == objID) {
		      var textElements = slideObjs.pageElements[i].shape.text.textElements;
		      var paragraphCnt = -1;

		      for(var j=0;j<textElements.length;j++) {
			  var textElem = textElements[j];

			  if(textElem.paragraphMarker != null) paragraphCnt++;
			  else {
			      if(textElem.textRun != null) {
				  if(paragraphNumber == paragraphCnt) {
				      var myStr = textElem.textRun.content;

				      replaceParagraphNumber = paragraphNumber;

				      var startIndex = textElem.startIndex;
				      var endIndex = textElem.endIndex;
				      
				      deleteTextInTheObj(curPageId, objID, startIndex, endIndex);

				      var paragraphID = paragraphTable[objID][paragraphNumber];

				      console.log(paragraphTable);
				      console.log(objID);
				      console.log(paragraphNumber);

				      console.log(highlightDictionary);
				      console.log(highlightDictionary[curPageId]);
				      console.log(objID + '-paragraph-' + paragraphID);

				      var pageNumber = highlightDictionary[curPageId][objID + '-paragraph-' + paragraphID][0][0];
				      var startElementIndex = highlightDictionary[curPageId][objID + '-paragraph-' + paragraphID][0][1];
				      var endElementIndex = highlightDictionary[curPageId][objID + '-paragraph-' + paragraphID][0][2];

				      console.log(highlightDictionary[curPageId][objID + '-paragraph-' + paragraphID]);

				      console.log(imageURL, curPageId, pageNumber, startElementIndex, endElementIndex);

				      createImage(imageURL, curPageId, pageNumber, startElementIndex, endElementIndex);
				  }
			      }
			      else {
				  console.log("################### ERROR ###################");
			      }
			  }
		      }
		  }
	      }
	  }, function(response) {
	      console.log(response.result.error.message);
	  });
      });

      function deleteTextInTheObj(curPageId, objID, startIndex, endIndex) {
	  if(startIndex == null) {
	      startIndex = 0;
	  }

	  console.log(curPageId, objID, startIndex, endIndex)

	      var requests = [ 
	      {
		  "deleteText": {
		      "objectId": objID,
		      "textRange": {
			  "startIndex": startIndex,
			  "endIndex": endIndex,
			  "type": "FIXED_RANGE"
		      }
		  }
	      } ];

	  console.log(requests);
	  gapi.client.slides.presentations.batchUpdate({
	      presentationId: PRESENTATION_ID,
	      requests: requests
	  }).then((response) => {
	      console.log("strange");
	      console.log(response);
	  }).catch(function(error) {
	      console.log('cache!');
	      console.log(error);

	      var requests = [ 
	      {
		  "deleteText": {
		      "objectId": objID,
		      "textRange": {
			  "startIndex": startIndex,
			  "endIndex": endIndex-1,
			  "type": "FIXED_RANGE"
		      }
		  }
	      } ];

	      console.log(requests);
	      gapi.client.slides.presentations.batchUpdate({
		  presentationId: PRESENTATION_ID,
		  requests: requests
	      }).then((response) => {
		  console.log("strange");
		  console.log(response);
	      }).catch(function(error) {
		  console.log('cache!');
		  console.log(error);
	      });
	  });
      }

      function appendImageQueryResult(response) {
	  for(var i=0;i<response.items.length;i++) {
	      var item = response.items[i];

	      $("#searchResultImages").append("<img id='imageQueryResultItem" + i + "' class='imageQueryResultItem' src='" + item.link + "' />");
	  }
      }
      function getImageQueryResult(queryString) {
	  queryString = queryString.replace(' ', '+');

	  $("#searchQueryInputBox").val(queryString);

	  $.get({
	      url:"https://www.googleapis.com/customsearch/v1?key=AIzaSyA160fCjV5GS8HhQtYj2R29huH9lnXURKw&cx=000180283903413636684:oxqpr8tki8w&q="+queryString+"&searchType=image",
	      success: appendImageQueryResult
	  });
      }

      $(document).on("extension_confirmPutParagraph", function(e) {
	  console.log(e.detail);
	  console.log(replaceFlag);

	  if(replaceFlag) {
	      replaceFlag = false;

	      console.log(e.detail.data.objID);
	      console.log(replaceParagraphNumber);

	      console.log(e.detail.data.oldParagraphIdentifiers);
	      console.log(e.detail.data.oldParagraphIdentifiers[replaceParagraphNumber]);

	      console.log(paragraphTable);

	      var identifier;

	      if(autoCompleteFlag) identifier = autoCompleteParagraphIdentifier;
	      else identifier = e.detail.data.oldParagraphIdentifiers[replaceParagraphNumber];

	      console.log(autoCompleteFlag);
	      console.log(autoCompleteParagraphIdentifier);
	      console.log(non_autoCompleteParagraphIdentifier);

	      autoCompleteFlag = false;
/*
	      if(replaceParagraphNumber == 0) identifier = e.detail.data.newParagraphIdentifiers[0];
	      else identifier = e.detail.data.oldParagraphIdentifiers[replaceParagraphNumber];*/

	      console.log(identifier);

	      paragraphTable[e.detail.data.objID][replaceParagraphNumber] = identifier;
  	      registerMapping(e.detail.data.objID, replaceParagraphNumber, identifier, true);

	      console.log(paragraphTable);

	      issueEvent(document, "root_changeParagraphIdentifier", {
		  paragraphNumber: replaceParagraphNumber,
		  paragraphId: identifier,
		  objId: e.detail.data.objID
	      });
	  }
      });

      $(document).on("loadGslide", function(e) {
    	$("#slideIframe").attr("src", "https://docs.google.com/presentation/d/1-ZGwchPm3T31PghHF5N0sSUU_Jd9BTwntcFf1ypb8ZY/edit");
      });

      $(document).on("addSectionHighlight", function(e) {
	  var p = e.detail;

	  console.log(p);
	  console.log(paragraphTable);

          addHighlight(p.pageId, [p.objId], p.pageNumber, getParagraphIdentifier(p.objId, p.paragraphNumber), p.minIndex, p.maxIndex, 'yellow', true);
	  // registerMapping(p.objId, 0, p.paragraphIdentifier);

	  console.log(paragraphTable);
      });

      $(document).on("getParagraphMapping", function(e) {
	  var p = e.detail;

	  console.log(p);

	  if(!dataLoaded) {
	      console.log("!!$#@%%#$^%^!%$#%!@%^@%$!@#$");
	  }

	  issueEvent(document, "paragraphMappingData", {
	      paragraphMapping: paragraphTable,
	  });

      });

      $(document).on("sendParagraphMappingData", function(e) {
          var p = e.detail;
          var id = "paragraph__" + p.objId + '-' + p.paragraphNumber;

	  console.log(p);
	  console.log("SEND PARAGRAPH MAPPING DATA");

	  if(p.isOverride){
	  	registerMapping(p.objId, p.paragraphNumber, p.paragraphId, true);
	  }
	  else {
	      if(!(p.objId in paragraphTable)) {
		  console.log(p.paragraphNumber);

		  registerMapping(p.objId, p.paragraphNumber, p.paragraphId, true);
		  issueEvent(document, "root_sendParagraphIdentifier", {
		      objId: p.objId,
		      paragraphNumber: p.paragraphNumber,
		      paragraphId: p.paragraphId
		  });
	      }
	      else if(paragraphTable[p.objId].length <= p.paragraphNumber) {
		  console.log(paragraphTable[p.objId].length, p.paragraphNumber);

		  registerMapping(p.objId, p.paragraphNumber, p.paragraphId, true);
		  issueEvent(document, "root_sendParagraphIdentifier", {
		      objId: p.objId,
		      paragraphNumber: p.paragraphNumber,
		      paragraphId: p.paragraphId
		  });
	      }
	      else {
		  issueEvent(document, "root_sendParagraphIdentifier", {
		      objId: p.objId,
		      paragraphNumber: p.paragraphNumber,
		      paragraphId: paragraphTable[p.objId][parseInt(p.paragraphNumber)]
		  });
	      }
	  }

      });

      $(document).on("addText", function(e) {
          console.log(e);

          console.log(e.detail.color);

	  if(!(e.detail.paragraphIdentifier in originalTextDictionary)) {
	      originalTextDictionary[e.detail.paragraphIdentifier] = [];
	  }

	  originalTextDictionary[e.detail.paragraphIdentifier].push(e.detail.text);

          console.log("FIRE!");

	  addText(e.detail.objId, e.detail.pageId, e.detail.text, e.detail.pageNumber, e.detail.paragraphIdentifier, e.detail.startIndex, e.detail.endIndex, e.detail.color);
      });

      $(document).on("extension_appendTextIntoParagraph", function(e) {
	  console.log(e.detail);

	  var data = e.detail.data;

	  var pageID = data.pageID;
	  var objID = data.objID;
	  var paragraphNumber = data.paragraphNumber;
	  var paragraphIdentifier = data.paragraphIdentifier;
	  var pageNumber = data.pageNumber;
	  var segmentStartIndex = data.segmentStartIndex;
	  var segmentEndIndex = data.segmentEndIndex;
	  var text = data.text;

	  if(!(paragraphIdentifier in originalTextDictionary)) {
	      originalTextDictionary[paragraphIdentifier] = [];
	  }

	  originalTextDictionary[paragraphIdentifier].push(text);

    	  appendTextIntoParagraph(pageID, objID, paragraphNumber, paragraphIdentifier, pageNumber, segmentStartIndex, segmentEndIndex, text);

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

      function appendText(objId, myText, pageNumber, paragraphIdentifier, startIndex, endIndex, color) {
         console.log("yay");

	 issueEvent(document, "root_appendParagraphIdentifier", {
	     objId: objId,
	     paragraphId: paragraphIdentifier
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

                     console.log(curClickedElements);
                     console.log(paragraphIdentifier);

                     console.log(color);

                     addHighlight(curPageId, [objId], pageNumber, paragraphIdentifier, startIndex, endIndex, color, true);
		     typeDictionary[paragraphIdentifier] = "text";

                     issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                             {
			        "pageNumber": pageNumber,
                                "startIndex": startIndex,
                                "endIndex": endIndex,
                                "slideObjId": "editor-" + objId + "-paragraph-" + paragraphIdentifier,
                                "color": 'blue',
                             });
                     });

                    issueEvent(document, "TEXT_ADD_COMPLETE", null);
                 }
         });
      }

      function fillText(objId, myText, pageNumber, paragraphIdentifier, startIndex, endIndex, color) {
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
           requests: requests }).then((createSlideResponse) => {
             console.log("succeed!");
             console.log(createSlideResponse);

             console.log(paragraphNumber);

             addHighlight(curPageId, [objId], pageNumber, paragraphIdentifier, startIndex, endIndex, color, true);

             issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
                     {
						"pageNumber": pageNumber,
                        "startIndex": startIndex,
                        "endIndex": endIndex,
                        "color": color,
                        "slideObjId": paragraphIdentifier,
             });

             issueEvent(document, "TEXT_ADD_COMPLETE", null);
         }).catch(function(error) {
             console.log('cache!');
             console.log(error);
         });
      }

      function addText(objId, pageId, myText, pageNumber, paragraphIdentifier, startIndex, endIndex, color) {
          console.log(color);

          if(objId != null) {
              appendText(objId, myText, pageNumber, paragraphIdentifier, startIndex, endIndex, color);
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
                 console.log(startIndex);
                 console.log(endIndex);

                 fillText(newObjId, myText, pageNumber, 0, startIndex, endIndex, color);
             });
          }
      }

      $("#insertText").on("click", function() {
              addText("SLIDES_API1293859000_1", "blahblah");
     });

      $(document).on("removeHighlight", function(e) {
              var p = e.detail;

	      if(!replaceFlag) {
		  removeHighlight(p.pageID, p.boxID, p.mappingIdentifiers, p.lastElemIndex, p.pageNumber, p.startIndex, p.endIndex);
		  if(p.updateFlag) {
		      updateHighlight(curPageId, [], null);
		  }
	      }

              });

    $(document).on("highlighted", function(details){
            console.log(details);

            console.log("I got this");
    });

    $(document).on("pdfjs_clearDatabase", function(e) {
	clearDatabase();
    });

    $(document).on("ADDTEXT_COMPLETED", function(e) {
            console.log(e.details);
    });

    $(document).on("clearPlaneCanvas", function(e) {
            $(".slidePlaneCanvasHighlight").remove();
    });

    $(document).on("highlightSlideObject", function(e) {
            $(".slidePlaneCanvasHighlight").remove();

            $("#slidePlaneCanvas").append(
                    '<div style="' + 
                    'position: absolute; ' + 
                    'width: ' + e.detail.width + '; ' + 
                    'height: ' + e.detail.height + '; ' + 
                    'left: ' + e.detail.left+ '; ' + 
                    'top: ' + e.detail.top + '; ' +
                    'background-color: blue;' + 
                    'opacity: 0.2" class="slidePlaneCanvasHighlight">' + 
                    '</div>'
                    );
    });

    $(document).on("get_slide_object_for_highlight", function(e) {
	console.log(e.detail);
	var myString = e.detail.data.slideObjId.split('-');

	console.log(myString);

	if(myString[2] == "paragraph") {
	    if(myString[1] in paragraphTable) {
	    	var paragraphs = paragraphTable[myString[1]];
	    	console.log(myString[3]);
	    	console.log(paragraphTable);

		for(var i=0;i<paragraphs.length;i++) {
		    if(paragraphs[i] == myString[3]) {
			console.log("get the paragraph number");
			console.log(i);

			issueEvent(document, "highlight_slide_object_mouse_enter", {
			    "slideObjId": "editor-" + myString[1] + '-paragraph-' + i
			});
		    }
		}
	    }
	    else {
		console.log("paragraph does not exist");
		console.log(myString);
		console.log(paragraphTable);
	    }
    	}
    });

    $(document).on("ROOT_UPDATE_HIGHLIGHT_REQUEST", function(e) {
        var p = e.detail;

        updateHighlight(p.pageId, p.objIdList, p.paragraphIdentifier);
    });

    function createImage(imageURL, pageID, pageNumber, startElementInx, endElementInx, queryString) {
	var requests = [ {
	    "createImage": {
		"url": imageURL,
		"elementProperties": {
		    "pageObjectId": pageID,
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

	    var objID = createSlideResponse.result.replies[0].createImage.objectId;

	    console.log(objID);

	    addHighlight(pageID, [objID], pageNumber, objID + "_figure", startElementInx, endElementInx, 'yellow', true);

	    registerMapping(objID, 99, objID + "_figure", true);

	    var id = objID + "_figure";

	    if(!(id in originalTextDictionary)) {
		originalTextDictionary[id] = [];
	    }

	    originalTextDictionary[id].push(queryString);
	});
    }
    $(document).on("SEND_IMAGE", function(e) {
	p = e.detail;

	console.log(p);

	createImage(p.imageURL, curPageId, p.curPageNumber, p.startElementInx, p.endElementInx, p.queryString);
	/*
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

	var objID = createSlideResponse.result.replies[0].createImage.objectId;

	console.log(objID);
	console.log(p);

	addHighlight(curPageId, [objID], p.curPageNumber, objID + "-figure", p.startElementInx, p.endElementInx, 'yellow', true);

	registerMapping(objID, 99, objID + "-figure", true);

	addHighlight(autoCompletePageID, [objID], pageNumber, paragraphIdentifier, segmentStartIndex, segmentEndIndex, 'yellow', true);

	issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
	{
	"pageNumber": pageNumber,
	"startIndex": segmentStartIndex,
	"endIndex": segmentEndIndex,
	"slideObjId": "editor-" + objID + "-paragraph-" + paragraphIdentifier,
	"color": 'blue',
	});

	console.log("nice");
	});
	*/
    });

    $(document).on("UPDATE_SLIDE_INFO", function(e) {
	var p = e.detail;

	var slideId = p.pageId;
	getPageInfo(slideId);
    });

    $(document).on("ROOT_UPDATE_CUR_PAGE_AND_OBJECTS", function(e) {
	var p = e.detail;

	curPageId = p.pageId;
	curClickedElements = p.clickedElements;
	curParagraphs = p.curParagraphs;

	console.log(p);
	    /*
	       console.log(curPageId);
	       console.log(curClickedElements);
	       */
    });

    $(document).on("appearAutoComplete", function(e) {
	var p = e.detail;

	currentAutoCompleteInstances = {};

	for(var i=0;i<p.length;i++) {
	    if(currentAutoCompleteInstances[p[i].objId] == null) {
                currentAutoCompleteInstances[p[i].objId] = {
                    text: p[i].text,
                    score: p[i].score
                };
            }
        }

        // console.log(p);

        for(var i=0;i<p.length;i++) {
            $("#autoCompleteTable tbody").append(
                    '<tr id="autoCompleteRow' + i + '" rowNumber="' + i + '">' + 
                    '<td class="autoCompleteTableFirst">' + (i+1) + '</td>' + 
                    '<td class="autoCompleteTableSecond order=' + (i+1) + ' onclick="autoCompleteItemClicked()" ">' + p[i].text + '</td>' + 
                    '</tr>'
                    );
        }

        $("#slidePlaneCanvasPopup").show();
    });

    function autoCompleteItemClicked() {
	console.log("here!");
	console.log(this);
    }
/*
    $(document).on("sendAutoCompleteInstance", function(e) {
        var p = e.detail;

        if(currentAutoCompleteInstances[p.objId] == null) {
            currentAutoCompleteInstances[p.objId] = {
                text: p.text,
                score: p.score
            };
        }
    });*/

    $(document).on("locateAutoComplete", function(e) {
        var p = e.detail;

        $("#autoCompleteTable").remove();

        $("#slidePlaneCanvasPopup").css("left", p.left);
        $("#slidePlaneCanvasPopup").css("top", p.top);

        $("#slidePlaneCanvasPopup").append(
            "<table id='autoCompleteTable'>" + 
            "<tbody>" + 
            "</tbody>" + 
            "</table>"
        );

        currentAutoCompleteInstances = {};

        $("#slidePlaneCanvasPopup").css("width", p.width);
        $("#slidePlaneCanvasPopup").css("height", "200px");

        // $("#slidePlaneCanvasPopup").show();
    });

    $(document).on("removeAutoComplete", function(e) {
        $("#slidePlaneCanvasPopup").hide();
    });

    function replaceTextInTheObj(autoCompletePageID, objID, paragraphIdentifier, originalText, replaceText, pageNumber, segmentStartIndex, segmentEndIndex) {
        var requests = [{
          replaceAllText: {
             "replaceText": replaceText + '\n',
             "pageObjectIds": [autoCompletePageID],
             "containsText": {
                 "text": originalText,
                 "matchCase": true
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
        }).then((result) => {
	    if(segmentStartIndex == -1) return;

            addHighlight(autoCompletePageID, [objID], pageNumber, paragraphIdentifier, segmentStartIndex, segmentEndIndex, 'yellow', true);

	    issueEvent(document, "PDFJS_HIGHLIGHT_TEXT", 
		    {
			"pageNumber": pageNumber,
			"startIndex": segmentStartIndex,
			"endIndex": segmentEndIndex,
			"slideObjId": "editor-" + objID + "-paragraph-" + paragraphIdentifier,
			"color": 'blue',
		    });
	    replaceFlag = true;
        });
      }

    function appendTextIntoParagraph(pageID, objID, paragraphNumber, paragraphIdentifier, pageNumber, segmentStartIndex, segmentEndIndex, text) {
        console.log(text);

	 issueEvent(document, "root_replaceParagraphIdentifier", {
	     objId: objId,
	     paragraphNumber: paragraphNumber,
	     paragraphId: paragraphIdentifier
	 });

        gapi.client.slides.presentations.pages.get({
          presentationId: PRESENTATION_ID,
          pageObjectId: pageID 
        }).then(function(response) {
            var slideObjs = response.result;

            for(var i=0;i<slideObjs.pageElements.length;i++) {
                if(slideObjs.pageElements[i].objectId == objID) {
                    var textElements = slideObjs.pageElements[i].shape.text.textElements;
                    var paragraphCnt = -1;

                    for(var j=0;j<textElements.length;j++) {
                        var textElem = textElements[j];

                        if(textElem.paragraphMarker != null) paragraphCnt++;
                        else {
                            if(textElem.textRun != null) {
                                if(paragraphNumber == paragraphCnt) {
                                    var myStr = textElem.textRun.content;
				    var myStrWithoutNewline = myStr.substr(0, myStr.length-1) + ' ';

				    replaceParagraphNumber = paragraphNumber;

				    console.log("WTF IS THIS?");
				    console.log(paragraphNumber);
				    console.log(paragraphCnt);

                                    replaceTextInTheObj(pageID, objID, paragraphIdentifier, myStr, myStrWithoutNewline + text, pageNumber, segmentStartIndex, segmentEndIndex)
                                    // replaceTextInTheObj(pageID, objID, paragraphIdentifier, myStr, myStr, pageNumber, segmentStartIndex, segmentEndIndex)

                                    return;
                                }
                            }
                            else {
                                console.log("################### ERROR ###################");
                            }
                        }
                    }
                }
            }

        }, function(response) {
	    console.log(response.result.error.message);
        });
    }
    function putTextIntoParagraph(autoCompletePageID, objID, paragraphNumber, paragraphIdentifier, pageNumber, segmentStartIndex, segmentEndIndex, text) {
        console.log(text);

        gapi.client.slides.presentations.pages.get({
          presentationId: PRESENTATION_ID,
          pageObjectId: autoCompletePageID 
        }).then(function(response) {
            var slideObjs = response.result;

            for(var i=0;i<slideObjs.pageElements.length;i++) {
                if(slideObjs.pageElements[i].objectId == objID) {
                    var textElements = slideObjs.pageElements[i].shape.text.textElements;
                    var paragraphCnt = -1;

                    for(var j=0;j<textElements.length;j++) {
                        var textElem = textElements[j];

                        if(textElem.paragraphMarker != null) paragraphCnt++;
                        else {
                            if(textElem.textRun != null) {
                                if(paragraphNumber == paragraphCnt) {
                                    var myStr = textElem.textRun.content;

				    if(!(paragraphIdentifier in originalTextDictionary)) {
					originalTextDictionary[paragraphIdentifier] = [];
				    }

				    originalTextDictionary[paragraphIdentifier].push(text);

                                    replaceTextInTheObj(autoCompletePageID, objID, paragraphIdentifier, myStr, text, pageNumber, segmentStartIndex, segmentEndIndex)

                                    return;
                                }
                            }
                            else {
                                console.log("################### ERROR ###################");
                            }
                        }
                    }
                }
            }


        }, function(response) {
          appendPre('Error: ' + response.result.error.message);
        });
    }

    $(document).on("autoCompleteRegister", function(e) {
	autoCompleteFlag = true;

        var p = e.detail;

        var text = p.text;
        var startIndex = p.segmentStartIndex;
        var endIndex = p.segmentEndIndex;
        var pageNumber = p.pageNumber;

	console.log(autoCompleteParagraphNumber + ' ' + autoCompleteParagraphIdentifier);

	replaceParagraphNumber = autoCompleteParagraphNumber;

        console.log(autoCompletePageID, autoCompleteObjID, autoCompleteParagraphNumber, autoCompleteParagraphIdentifier, pageNumber, startIndex, endIndex, text);
        putTextIntoParagraph(autoCompletePageID, autoCompleteObjID, autoCompleteParagraphNumber, autoCompleteParagraphIdentifier, pageNumber, startIndex, endIndex, text);
    });

    $(document).on("prepareAutoCompleteNumbers", function(e) {
        var p = e.detail;

        autoCompleteObjID = p.objID;
        autoCompleteParagraphNumber = p.paragraph;
        autoCompleteParagraphIdentifier = p.paragraphAutocompleteIdentifier;
        non_autoCompleteParagraphIdentifier = p.paragraphIdentifier;
        autoCompletePageID = p.pageID;

        console.log(autoCompleteObjID);
        console.log(autoCompleteParagraphNumber);
        console.log(autoCompleteParagraphIdentifier);
        console.log(autoCompletePageID);

        $("#slidePlaneCanvasPopup").css("left", p.left);
        $("#slidePlaneCanvasPopup").css("top", p.top);
        $("#slidePlaneCanvasPopup").css("width", p.width);
        $("#slidePlaneCanvasPopup").css("height", "200px");

        $("#autoCompleteNumberInput").val('');

        issueEvent(document, "prepareAutoCompleteNumbersDone", null);
    });

    $(document).on("checkAutoComplete", function(e){
        var p = e.detail;
        var pageID = p.pageID;
        var objID = p.objID;
        var paragraphNumber = p.paragraphNumber;
        var paragraphIdentifier = p.paragraphIdentifier

        var key = objID + '-paragraph-' + paragraphIdentifier;

        // console.log(p);
        // console.log(highlightDictionary);
        // console.log(highlightDictionary[pageID]);

        /*
        if(highlightDictionary[pageID] != null)
            console.log(highlightDictionary[pageID][key]);
            */

        // console.log(pageID);
        // console.log(key);
        // console.log(highlightDictionary);

        if(highlightDictionary[pageID] != null && highlightDictionary[pageID][key] != null) {
            issueEvent(document, "__removeAutoComplete", null);
	    // issueEvent(document, "PdfjsMoveScrollBar", highlightDictionary[pageID][key][0]);
        }
        else {
            issueEvent(document, "requestShowingAutoComplete", {
                top: p.top,
                left: p.left,
                width: p.width,
                words: p.words
            });
        }
        
    });

    $(document).on("extension_showSlideNavigator", function(e) {
        var p = e.detail.data;

	console.log(p);

	$("#slideNavigator").show();
	$("#slidePlaneCanvas").show();
	$("#contentVisualizer").show();

	$("#slideNavigator").css("left", p.left);
	/*
	$("#slideNavigator").css("top", p.top-50);
	*/

	console.log($("#contentVisualizer"));

	$("#contentVisualizer").css("left", p.left);
	$("#contentVisualizer").css("top", p.top-400);
	$("#contentVisualizer").height(400);

	issueEvent(document, "root_slideNavigatorShownCheck", null);
    });

    $(document).on("extension_getInlineSectionHeaders", function(e) {
	console.log(highlightDictionary);

	issueEvent(document, "root_getSectionHierarchyStructure", {
	    highlightDictionary: highlightDictionary
	});
    });

    function autoCompleteTableRowHighlight(rowNum) {
	console.log(rowNum);

	$(".selectedRow").removeClass("selectedRow");

	$("tr[rowNumber='" + rowNum + "']").each(function(e) {
	    $(this).find("td").addClass("selectedRow");
	    $(this).addClass("selectedRow");
	});
    }

    $(document).on("showAutoCompleteNumbers", function(e) {
        autoCompleteStatus = true;

        $("#slidePlaneCanvasPopup").show();

        $("#autoCompleteNumberInput").focus();

	curAutocompleteRow = 0;
	autoCompleteTableRowHighlight(curAutocompleteRow);
    });

    function getMappedObjects() {
	var retValue = []; 

	var keys = Object.keys(highlightDictionary);

	for(var i=0;i<keys.length;i++) {
	    var identifierList = highlightDictionary[keys[i]];

	    var p = Object.keys(identifierList);

	    for(var j=0;j<p.length;j++) {
		retValue.push([p[j].split('-')[0], p[j].split('-')[2]]);
	    }
	}

	return retValue;
    }


    function getParagraphNumber(paragraphIdentifier) {
	var objID = paragraphIdentifier[0];
	var pid = paragraphIdentifier[1];

	if(objID in paragraphTable) {
	    for(var i=0;i<paragraphTable[objID].length;i++) {
		if(paragraphTable[objID][i] == pid) {
		    return i;
		}
	    }

	    return null;
	}
	else return null;
    }

    $(document).on("extension_updateNavigationElement", function(e) {
	var p = e.detail.data;

	console.log(p);

	var id = p.id;
	var objID = id.split('-')[1];
	var paragraphNumber = id.split('-')[3];

	console.log(id, objID, paragraphNumber);

	var paragraphID = paragraphTable[objID][paragraphNumber];

	curNavigationElement = getIndexonMappedObjects(paragraphID);

	console.log(curNavigationElement);
    });

    function getIndexonMappedObjects(paragraphID) {
	var mappedObjects = getMappedObjects();

	console.log(mappedObjects);
	console.log(paragraphID);

	for(var i=0;i<mappedObjects.length;i++) {
	    if(mappedObjects[i][1] == paragraphID) {
		return i;
	    }
	}
	
	return null;
    }

    $(".slideNavigatorButton").on("click", function(e) {
	var dir;

	var mappedObjects = getMappedObjects();

	if($(this).attr("id")[0] == 'p') {
	    dir = -1;
	}
	else if($(this).attr("id")[0] == 'n'){
	    dir = 1;
	}
	else {
	    dir = 0;

	    issueEvent(document, "root_locateObject", {
		objID: null,
		paragraphNumber: null
	    });

	    return;
	}

	if(curNavigationElement == null) curNavigationElement = 0;
	else {
	    curNavigationElement += dir;

	    if(curNavigationElement >= mappedObjects.length) curNavigationElement = 0;
	    else if(curNavigationElement < 0) curNavigationElement = mappedObjects.length-1;
	}

	console.log("clicked!");
	console.log(paragraphTable);
	console.log(highlightDictionary);

	console.log(mappedObjects);
	console.log(curNavigationElement);
	console.log(mappedObjects[curNavigationElement]);

	var objID = mappedObjects[curNavigationElement][0];
	var paragraphNumber = getParagraphNumber(mappedObjects[curNavigationElement]);

	console.log(mappedObjects);
	console.log(paragraphNumber);

	// issueEvent(document, "root_simulateClick", slideInfo[0].slideID);
	issueEvent(document, "root_locateObject", {
	    objID: objID,
	    paragraphNumber: paragraphNumber
	});
    });

    $(document).on("pdfjs_locateObject", function(e) {
	var p = e.detail.data;

	var objID = p.objID;
	var paragraphID = p.paragraphID;

	if(objID in paragraphTable) {
	    var paragraphNumber = null;

	    for(var i=0;i<paragraphTable[objID].length;i++) {
		if(paragraphTable[objID][i] == paragraphID) {
		    paragraphNumber = i;
		}
	    }

	    if(paragraphNumber != null) {
    		curNavigationElement = getIndexonMappedObjects(paragraphID) ;
		issueEvent(document, "root_locateObject", {
		    objID: objID,
		    paragraphNumber: paragraphNumber
		});
	    }
	}
    });

    $("#autoCompleteNumberInput").on("keydown", function(e) {
       if (e.keyCode === 13) {
           // Trigger the button element with a click
           // $("#autoCompleteSubmitBtn").click();
	   $("#slidePlaneCanvasPopup").hide();

	   var rowObject = $("tr[rowNumber='" + curAutocompleteRow + "']");

	   console.log(rowObject);
	   console.log($(rowObject).find(".autoCompleteTableSecond"));
	   console.log($(rowObject).find(".autoCompleteTableSecond").html());
	   console.log($(rowObject).find(".autoCompleteTableFirst").html());

	   issueEvent(document, "autoCompleteSubmitted", {
	       data: parseInt($(rowObject).find(".autoCompleteTableFirst").html())
	   });
       }

       if (e.keyCode == 27) {
            $("#autoCompleteCancelBtn").click();
       }

       if (e.keyCode == 40) {
	   if(curAutocompleteRow < $("#autoCompleteTable tr").length-1)
	       curAutocompleteRow++;

	   autoCompleteTableRowHighlight(curAutocompleteRow);

	   console.log($("#autoCompleteTable").offset().top);
	   console.log($('#autoCompleteRow' + curAutocompleteRow).offset().top);

	   $("#slidePlaneCanvasPopup").scrollTop(
		   $('#autoCompleteRow' + curAutocompleteRow).offset().top - 
		   $('#autoCompleteTable').offset().top
		   );

	   console.log($("#autoCompleteTable").scrollTop());
       }

       if(e.keyCode == 38) {
	   if(curAutocompleteRow > 0)
	       curAutocompleteRow--;
	   autoCompleteTableRowHighlight(curAutocompleteRow);

	   console.log($("#autoCompleteTable").offset().top);
	   console.log($('#autoCompleteRow' + curAutocompleteRow).offset().top);

	   $("#slidePlaneCanvasPopup").scrollTop(
		   $('#autoCompleteRow' + curAutocompleteRow).offset().top - 
		   $('#autoCompleteTable').offset().top
		   );
       }

       });

    $("#autoCompleteSubmitBtn").on("click", function(e) {
        $("#slidePlaneCanvasPopup").hide();

	var rowObject = $("tr[rowNumber='" + curAutocompleteRow + "']");

	console.log(rowObject);
	console.log($(rowObject).find(".autoCompleteTableSecond"));
	console.log($(rowObject).find(".autoCompleteTableSecond").html());
	console.log($(rowObject).find(".autoCompleteTableFirst").html());

        issueEvent(document, "autoCompleteSubmitted", {
            data: parseInt($(rowObject).find(".autoCompleteTableFirst").html())
        });
    });

    $("#autoCompleteCancelBtn").on("click", function(e) {
        issueEvent(document, "autoCompleteCancelled", null);
    });

    $(document).on("clearVisualizeParagraph", function(e) {
            $(".slideVisualizeParagraph").remove();
    });

    $(document).on("click", ".slideVisualizeParagraph", function(e) {
	if($(this).hasClass("selectedVisualizeParagraph")) {
	    $(".selectedVisualizeParagraph").removeClass("selectedVisualizeParagraph");
	}
	else {
	    $(".selectedVisualizeParagraph").removeClass("selectedVisualizeParagraph");
	    $(this).addClass("selectedVisualizeParagraph");
	}

    });

    function getDist(a, b) {
	var splitted = a.split(' ');

	var maxValue = 0;

	for(var i=0;i<b.length;i++) {
	    var score = 0;
	    var b_splitted = b[i].split(' ');

	    for(var i=0;i<splitted.length;i++) {
		if(b_splitted.indexOf(splitted[i]) > -1) {
		    score++;
		}
	    }

	    maxValue = Math.max(maxValue, score);
	}

	return maxValue;
    }

    $(document).on("extension_updateSimilarBar", function(e) {
        var p = e.detail.data;
	var retValue = 0;
	var fullScore = 0;

	console.log(p);

	for(var i=0;i<p.curObjects.length;i++) {
	    console.log(i);
	    console.log(p.curObjects[i].text);

	    if(p.curObjects[i].text.length <= 0) continue;

	    if(p.curObjects[i].text.split(' ')[0] == "Click" && 
		    p.curObjects[i].text.split(' ')[1] == "to" && 
		    p.curObjects[i].text.split(' ')[2] == "add") continue;

	    var id = p.curObjects[i].id;
	    var substr_id = id.substr(7, id.length-7);

	    var objID = substr_id.split('-')[0];
	    var paragraphID = substr_id.split('-')[2];

	    var paragraphID = paragraphTable[objID][paragraphID];

	    fullScore += p.curObjects[i].text.split(' ').length;

	    if(paragraphID in originalTextDictionary) {
		console.log(p.curObjects[i].text, originalTextDictionary[paragraphID], getDist(p.curObjects[i].text, originalTextDictionary[paragraphID]));
		retValue += getDist(p.curObjects[i].text, originalTextDictionary[paragraphID]);
	    }
	}

	issueEvent(document, "root_submitSimilarBarScore", {
	    total: fullScore,
	    match: retValue,
	    pageID: p.pageID
	});
    });

    $(document).on("pdfjs_disableSlideplane", function(e) {
	$("#slidePlaneCanvas").css("pointer-events", "auto");
	$("#slidePlaneCanvas").css("background-color", "rgba(128, 128,128, 0.15)");
    });

    $(document).on("pdfjs_enableSlideplane", function(e) {
	$("#slidePlaneCanvas").css("pointer-events", "none");
	$("#slidePlaneCanvas").css("background-color", "");
    });

    $(document).on("visualizeParagraph", function(e) {
        var p = e.detail;
	var border = '';
	var text = p.text;
	var boundaryFlag = p.boundaryFlag;

	if(pageCanvasDebugging || boundaryFlag) {
	    if(p.flag) border = "3px solid red";
	    else border = "2px dotted black";
	}

	var pidObj = $("#" + p.pid + "-boundary");

	var objID = p.pid.split("-")[1];
	var paragraphNumber = p.pid.split("-")[3];
	var paragraphID;

	if(objID in paragraphTable && paragraphNumber in paragraphTable[objID]) {
	    paragraphID = paragraphTable[objID][paragraphNumber];
	}
	else paragraphID = null;

	console.log(p);
	console.log(p.pageID);
	console.log($(pidObj));
	console.log(highlightDictionary);
	console.log(paragraphTable);
	console.log(paragraphID);

	if(p.pageID in highlightDictionary && paragraphID != null && 
  	  (objID + "-paragraph-" + paragraphID) in highlightDictionary[p.pageID] && 
	  highlightDictionary[p.pageID][objID + "-paragraph-" + paragraphID].length > 0) {
	    $("#slidePlaneCanvas").append(
		    '<div ' + 
		    'id="' + p.pid + '-mappingIdentifier" ' + 
		    'style="' + 
		    'position: absolute; ' + 
		    'width: 15; ' + 
		    'height: 15; ' + 
		    'left: ' + (e.detail.left-20) + '; ' + 
		    'top: ' + e.detail.top + '; ' +
		    '" class="slideVisualizeParagraph slideVisualizeParagraphIdentifier" ' + 
		    'draggable="true" ' + 
		    'pageID="' + p.pageID + '" ' + 
		    'objID="' + objID + '" ' + 
		    'paragraphID="' + paragraphID + '" ' + 
		    '>' + 
		    '</div>'
		    );
	    
	    
	    $("#" + p.pid + '-mappingIdentifier').hover(function() {
		var objID = $(this).attr("id").substr(0, $(this).attr("id").length-18);
		var boundaryObj = $("#" + objID + '-boundary');

		$(boundaryObj).css("border", "2px dotted black");
	    }, function() {
		var objID = $(this).attr("id").substr(0, $(this).attr("id").length-18);
		var boundaryObj = $("#" + objID + '-boundary');

		$(boundaryObj).css("border", "");
	    });
	}

	if($(pidObj).length > 0) {
	    $(pidObj).css("border", border);
	}
	else {
	    $("#slidePlaneCanvas").append(
		    '<div ' + 
		    'id="' + p.pid + '-boundary" ' + 
		    'style="' + 
		    'position: absolute; ' + 
		    'width: ' + e.detail.width + '; ' + 
		    'height: ' + e.detail.height + '; ' + 
		    'left: ' + e.detail.left+ '; ' + 
		    'top: ' + e.detail.top + '; ' +
		    'border: ' + border + 
		    '" class="slideVisualizeParagraph" ' + 
		    ' paragraphID="' + paragraphID + '" ' + 
		    '>' + 
		    '</div>'
		    );

	    // FOR DEBUGGING
	    //
	    //
	    //
	    //
	   
	    /*
	    $("#slidePlaneCanvas").append(
		    '<div ' + 
		    'id="' + p.pid + '-boundary-prime" ' + 
		    'style="' + 
		    'position: absolute; ' + 
		    'width: ' + e.detail.width + '; ' + 
		    'height: ' + e.detail.height + '; ' + 
		    'left: ' + e.detail.left+ '; ' + 
		    'top: ' + (e.detail.top-300) + '; ' +
		    'border: ' + border + 
		    '" class="slideVisualizeParagraph" ' + 
		    ' paragraphID="' + paragraphID + '" ' + 
		    '>' + 
		    '</div>'
		    );
	    $("#slidePlaneCanvas").append(
		    '<div ' + 
		    'id="' + p.pid + '-paragraphID" ' + 
		    'style="' + 
		    'position: absolute; ' + 
		    'width: ' + e.detail.width + '; ' + 
		    'height: ' + e.detail.height + '; ' + 
		    'left: ' + e.detail.left+ '; ' + 
		    'top: ' + (e.detail.top-300) + '; ' +
		    'border: ' + border + 
		    '" class="slideVisualizeParagraph" ' + 
		    '>' + paragraphID  + 
		    '</div>'
		    );
		    */

	}

	/*
        if($(".slideVisualizeParagraph").length > 0) {
            $(".slideVisualizeParagraph").css("left", e.detail.left);
            $(".slideVisualizeParagraph").css("top", e.detail.top);
            $(".slideVisualizeParagraph").width(e.detail.width);
            $(".slideVisualizeParagraph").height(e.detail.height);

            $(".slideVisualizeParagraph").focus();
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
	*/
    });
/*
	readTextFile("./generic/web/metadata.tei", 'xml');
	readTextFile("./generic/web/metadata.json", 'json');
*/
	
    $(document).on("mousedown", ".slideVisualizeParagraphIdentifier", function(e) {
	console.log("MOUSEDOWN");
	    isMappingIdentifierDragging = false;
    });

    $(document).on("mousemove", ".slideVisualizeParagraphIdentifier", function(e) {
	console.log("MOUSEMOVE");
	isMappingIdentifierDragging = true;
    });


    $("#slidePlaneCanvas").mouseup(function(e) {
	console.log("MOUSEUP");
	var wasDragging = isMappingIdentifierDragging;
	isMappingIdentifierDragging = false;
	if (!wasDragging) {
	    console.log("HELLO DRAGGING");
	}
    });

    $(document).on("click", ".slideVisualizeParagraphIdentifier", function(e) {
	console.log("HELLO?!");
	console.log($(this));

	var pageID = $(this).attr("pageID");
	var paragraphID = $(this).attr("paragraphID");
	var objID = $(this).attr("objID");

	var highlight = highlightDictionary[pageID][objID + "-paragraph-" + paragraphID];
	issueEvent(document, "PdfjsMoveScrollBar", highlight);
    });

    $(document).on("click", "#outlinePlaneContent", function(e){
        var x = e.clientX, y = e.clientY;
        var elementMouseIsOver = document.elementFromPoint(x, y);

        console.log("clicked!");
        console.log($(elementMouseIsOver));

        $(".outlineLineEditor").each(function(index) {
            $(this).css("background-color", "white");
        });

        if($(elementMouseIsOver).hasClass("outlineLineEditor")) {
           $(elementMouseIsOver).css("background-color", "blue");
        }
    });

    // putNewOutlineLine(0, 0, "blah");

    resize();
/*
    $(window).on("keydown", function(e) {
            console.log("keydown!");
            });
            */
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

    function resize() {
        windowsHeight = $(window).height();
        windowsWidth = $(window).width();

        $("#leftPlane").height(windowsHeight-1);
        $("#slidePlane").height(windowsHeight-1);
        $("#wrapper").width(windowsWidth-1);

	$("#searchResultTab").height(windowsHeight * 30 / 100);
	$("#searchResultTab").width(windowsWidth-1);

	$("#searchQueryInputBox").width(windowsWidth * 60 / 100);
	$("#searchResultTab").css("top", windowsHeight * 69 / 100);

        $("#outlineLineEditor1").css("padding-left", $("#outlineLineBullet1").width);

	$("#searchResultTab").resizable();
    }

    $(window).resize(function() {
	resize();
    });
/*
    function refSuccess(e) {
        console.log(e);
    }

    $.ajax({
url: "https://api.crossref.org/works?rows=5&query.title=Trace-based+Just-in-Time+Type+Specialization+for+Dynamic+Languages",
success: refSuccess,
dataType: "json"
            });*/

    loadData();
}

$(document).ready(function() {
    /*
    var properties = {annotators: "parse"}; 
    var property_string = JSON.stringify(properties); 
    var properties_for_url = encodeURIComponent(property_string); 

    $.ajax({ type: "POST", url: 'http://localhost:9000/?properties=' + properties_for_url, 
	data: 'The quick brown fox jumped over the lazy dog.', 
	success: function (data){ 
	    alert("success");
	    console.log(data);

	    parse = data.sentences[0].parse;  

	    parsing(parse);

	    parse = parse.split(' ');

	    console.log(parse);
	}, 
	error: function (responseData, textStatus, errorThrown) 
	{ alert('POST failed.'); } 
    });
    */

    console.log("clear db");
    myDB = new PouchDB('doc2slide_db');
    // clearDatabase();
    //
    $(document).on("initialSlideGeneration", function(e) {
	  var p = e.detail;

	  sectionParagraph = p.paragraph;
	  sectionStructure = p.sections.slice(0, 2);
	  paperTitle = p.title;
	  paperAuthors = p.authors;
	prepare();
    });
});

