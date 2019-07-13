import xml.etree.ElementTree as ET

inputString = ''
f = open("metaData.tei", "r");

for line in f :
    inputString = inputString + line

startIndex = inputString.find("<body>");
endIndex = inputString.find("</body>");

subStr = inputString[startIndex:endIndex]

def removeParenthesis(s) :
    cnt = 0
    retValue = ''

    for i in range(len(subStr)) :
        if subStr[i] == "<" :
            cnt = cnt + 1
        elif subStr[i] == ">" :
            cnt = cnt - 1
            retValue = retValue + ' ';
        else :
            if cnt == 0 :
                retValue = retValue + subStr[i]

    return retValue

print(removeParenthesis(subStr))
