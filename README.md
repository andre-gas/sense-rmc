# sense-rmc

## Qlik Sense Report Management Console
For this console I used the [AMC](https://community.qlik.com/t5/Official-Support-Articles/AMC-Application-Management-Console-an-alternative-to-the-QMC-for/ta-p/1713646) as template. Thanks Qlik!


## Installation step
1. Log in to your Sense QMC and move into *Content Library* section.
2. Click on *Create new* button.
![02](https://user-images.githubusercontent.com/33024172/197726220-e58a4f8c-5510-47ce-be43-66fa7b75a275.png)
3. Set a name for the library. Be careful, the name used is going to be used later to call the resource, it is case sensitive. In the below example I used "rmc".
![03](https://user-images.githubusercontent.com/33024172/197726254-1796edac-5986-45cb-baea-a2d8835fb808.png)
4. After creating the library you set the permission to access it. You could limit the access by users, groups, etc.. or you could enable it for all users using the following syntax (you should insert it into advanced form)
```
!user.IsAnonymous()
```
  ![04](https://user-images.githubusercontent.com/33024172/197726499-71a33fb0-ac35-4588-ab2b-c39920492369.png)
5. Click on *Upload* button to upload files into library. You must import all files of that project.
![05](https://user-images.githubusercontent.com/33024172/197726515-f90266bc-bd3a-4d3a-8fb2-65108515c8b1.png)
6. Ok, great, you've installed the console and now you could access it from the URL https://<senseserver>/<vp/content/<library name>/home.html (in my case https://senseserver/content/rmc/home.html).

## How it works
Using this console you could list and manage all reports for those whom you have permission in QMC context. You could view your reports by deafult, while the RootAdmin could manage them all.
To open it you must have the right security rules in Hub context. Only the owner could open a report, by default.
