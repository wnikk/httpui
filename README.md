## HttpUi.js Class

The `HttpUi` class is a versatile JavaScript library designed to simplify AJAX requests and UI interactions. It supports both jQuery and Fetch API for making HTTP requests, and it can be used as a jQuery plugin, a global function, or a module in modern JavaScript frameworks like Vue or React.

### Features

- **Singleton Pattern**: Ensures a single instance of the `HttpUi` class is used throughout the application.
- **AJAX Requests**: Supports GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS methods.
- **jQuery and Fetch API**: Automatically uses jQuery for AJAX requests if available, otherwise falls back to Fetch API.
- **UI Interactions**: Provides methods to display loaders, alerts, and error messages.
- **Form Serialization**: Serializes form data for easy submission.
- **Error Handling**: Displays detailed error messages and handles common HTTP errors gracefully.

### Usage

#### As a jQuery Plugin

```javascript
$(document).ready(function() {
    $('.form-basic').on('submit', function(e) {
        e.preventDefault();
        $(this).httpUi({
            method: 'PUT',
            url: '/your-url',
            context: this,
            onSuccess: (data, response) => console.log('Success:', data),
            onError: (error, response) => console.error('Error:', error)
        });
    });
});
```

#### As a Global Function

```javascript
document.querySelector('.form-basic').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        const response = await httpUi({
            method: 'PUT',
            url: '/your-url',
            context: this
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error);
    }
});
```

#### As a Module in Vue or React

```javascript
import httpUi from 'path/to/centUi';

async function submitForm(e) {
    e.preventDefault();
    httpUi({
        method: 'PUT',
        url: '/your-url',
        context: e.target,
    }).then(
        response => console.log('Success:', response.data)
    ).catch(
        error => console.error('Error:', error)
    );
}
document.querySelector('.form-basic').addEventListener('submit', submitForm);
```

### Methods

- `request(params)`: Sends an AJAX request with the specified parameters.
- `get(url, params)`: Sends a GET request.
- `post(url, data, params)`: Sends a POST request.
- `put(url, data, params)`: Sends a PUT request.
- `delete(url, params)`: Sends a DELETE request.
- `patch(url, data, params)`: Sends a PATCH request.
- `head(url, params)`: Sends a HEAD request.
- `options(url, params)`: Sends an OPTIONS request.

### Parameters

- `url`: The URL to send the request to.
- `method`: The HTTP method to use (default is 'GET').
- `data`: The data to send with the request.
- `onSuccess(response)`: Callback function to handle a successful response.
- `onError(error)`: Callback function to handle an error response.
- `context`: The context in which to execute the callbacks.
- `contextLock`: The element to display the loader on.
- `contextStatus`: The element to display status messages on.

### Installation

To install the `HttpUi` library, include the `httpUi.js` file in your project and use it as described above.

## Contributing

Please report any issue you find in the issues page. Pull requests are more than welcome.


## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
