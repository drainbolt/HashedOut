 let footer = () => 
 {
 return '<footer class="footer font-small pt-4">\
    <div class="container-fluid text-center text-md-left">\
        <!-- Content -->\
        <div class="col-md-4 mb-md-0 mb-4">\
        <h5 class="font-weight-bold text-uppercase mt-3 mb-4">Hashed Out</h5>\
        <ul class="list-unstyled">\
          <li>\
            <p style="background: transparent; color: white; font-size: 15px; margin: 0px; padding: 0px;";>Hashed Out is the web application for collecting Twitter data. If content is used please link the github repository.</p>\
          </li>\
          <img src="Logo.png" style = "border: ridge; border-color:deepskyblue; border-radius:40px; width: 60px; height: 60px">\
      </ul>\
        </div>\
      <div class="col-md-4 mb-md-0 mb-4">\
        <h5 class="font-weight-bold text-uppercase mt-3 mb-4">About Us</h5>\
        <ul class="list-unstyled">\
            <li>\
              <a href="index.html">Home</a>\
            </li>\
            <li>\
              <a href="news.html">News</a>\
            </li>\
            <li>\
              <a href="help.html">Help</a>\
            </li>\
            <li>\
              <a href="contact.html">Contact</a>\
            </li>\
        </ul>\
      </div>\
      <div class="col-md-4 mb-md-0 mb-4">\
        <h5 class="font-weight-bold text-uppercase mt-3 mb-4">Legal</h5>\
          <ul class="list-unstyled">\
            <li>\
              <a href="https://developer.twitter.com/en/docs">Twitter</a>\
            </li>\
            <li>\
              <a href="https://github.com/utk-cs/2019fall_groot/">Github</a>\
            </li>\
            <li>\
              <a href="#!">License</a>\
            </li>\
            <li>\
              <a href="cookie.html">Cookie Policy</a>\
            </li>\
        </ul>\
    </div>\
  </footer>'
 }

 document.write(footer())