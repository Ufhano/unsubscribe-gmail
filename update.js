/**
 * Unsubscribe from emails labeled "Unsubscribe" by following their
 * List-Unsubscribe URLs and then removing the label.
 */
function main() {
  // 1. Retrieve the Gmail label "Unsubscribe"
  var label = GmailApp.getUserLabelByName('Unsubscribe');
  if (!label) {
    Logger.log('Label "Unsubscribe" not found. Please create it first.');
    return;
  }

  // 2. Get all threads under this label
  var threads = label.getThreads();
  Logger.log('Found ' + threads.length + ' threads with label "Unsubscribe".');

  // 3. Loop through each thread
  threads.forEach(function (thread) {
    try {
      // 3.1 Get the first message in the thread (usually the one with headers)
      var message = thread.getMessages()[0];

      // 3.2 Extract the full raw email content
      var rawContent = message.getRawContent();

      // 3.3 Attempt to match the List-Unsubscribe header
      var unsubscribeHeaderMatch = rawContent.match(
        /^List-Unsubscribe:\s*((.|\r\n\s)+?)\r\n/m
      );

      // Skip if no List-Unsubscribe header found
      if (!unsubscribeHeaderMatch) {
        Logger.log('No List-Unsubscribe header found for thread: ' + thread.getId());
        return;
      }

      var headerValue = unsubscribeHeaderMatch[1];

      // 3.4 Extract the unsubscribe URL from < >
      var urlMatch = headerValue.match(/<(https?:\/\/[^>]+)>/);
      if (!urlMatch) {
        Logger.log('No unsubscribe URL found in header for thread: ' + thread.getId());
        return;
      }

      var unsubscribeUrl = urlMatch[1];

      // 3.5 Perform the unsubscribe HTTP request
      var response = UrlFetchApp.fetch(unsubscribeUrl, {
        muteHttpExceptions: true // Avoid script stop on non-200 responses
      });

      // 3.6 Log the status and URL
      Logger.log('Unsubscribe response ' + response.getResponseCode() + ' for URL: ' + unsubscribeUrl);

      // 3.7 After processing, remove the label to avoid duplicate attempts
      thread.removeLabel(label);
    } catch (err) {
      // Catch any unexpected errors for this thread
      Logger.log('Error processing thread ' + thread.getId() + ': ' + err);
    }
  });

  Logger.log('Finished processing all threads.');
}
