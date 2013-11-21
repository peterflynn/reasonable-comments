Reasonable Comments for Brackets
================================
Simple enhancements for typing block comments in Brackets: when you press Enter, the next line is automatically prefixed with a properly indented "`*`". So for example, instead of this:

```
    /**
|
     */
```

You'll get this:

```
    /**
     * |
     */
```

It also closes the comment automatically when you press Enter, if needed. So when you press Enter here:

```
    /**|
```

You'll get this:

```
    /**
     * |
     */
```


How to Install
==============
Reasonable Comments is an extension for [Brackets](https://github.com/adobe/brackets/), a new open-source code editor for the web.

To install extensions:

1. Choose _File > Extension Manager_ and select the _Available_ tab
2. Search for this extension
3. Click _Install_!


### License
MIT-licensed -- see `main.js` for details.

### Compatibility
Brackets Sprint 14 or newer (or any version of Adobe Edge Code).