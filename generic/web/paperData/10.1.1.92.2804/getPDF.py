import xml.etree.ElementTree as ET
import requests
import json
import wget
import os
import shutil

tree = ET.parse('metaData.tei')
root = tree.getroot()

prefix = root.tag[:-3]

for listBibl in root.iter(prefix + "listBibl") :
    for biblStruct in listBibl.iter(prefix + "biblStruct") :
        bibId = ''

        for key in biblStruct.attrib :
            if key[-2:] == "id" :
                bibId = biblStruct.attrib[key]

        analytic = biblStruct.find(prefix + "analytic")

        if(analytic == None) :
            continue

        title = analytic.find(prefix + "title")

        print(bibId)
        print(title.text)

        if(title == None) :
            continue

        replacedText = title.text.replace(' ', '+')

        URL = "https://www.googleapis.com/customsearch/v1?key=AIzaSyBLn8HDbzhQB5Obwg39AMHYxSvhn_F2vdQ&cx=000180283903413636684:oxqpr8tki8w&q=\"" + replacedText + "\"+filetype%3Apdf"

        print(URL)

        r = requests.get(url = URL)

        parsedJson = r.json()

        if("items" in parsedJson) :
            for x in parsedJson["items"] :
                if x["link"][-3:] == "pdf" :
                    print(x["link"])
                    
                    try:
                        shutil.rmtree(bibId)
                    except:
                        pass

                    os.makedirs(bibId)
                    filename = wget.download(x["link"], out=bibId + '/')
                    print(filename)

                    break

