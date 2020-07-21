# Timed field list

![Selected](extras/readme-images/selected.png)

| None selected | All blocked | select_multiple | Not timed |
| --- | --- | --- | --- |
| <img src="extras/readme-images/none-selected.png" alt="None selected" title="None selected" width="150px"/> | <img src="extras/readme-images/all-blocked.png" alt="All blocked" title="All blocked" width="150px"/> | <img src="extras/readme-images/select_multiple.png" alt="select_multiple" title="select_multiple" width="150px"/> | <img src="extras/readme-images/not-timed.png" alt="Not timed" title="Not timed" width="150px"/> |

| Milliseconds | No change | Blocked checks | No blocking |
| --- | --- | --- | --- |
| <img src="extras/readme-images/milliseconds.png" alt="Milliseconds" title="Milliseconds" width="150px"/> | <img src="extras/readme-images/nochange.png" alt="No change" title="No change" width="150px"/> | <img src="extras/readme-images/sm-blocked.png" alt="Blocked checks" title="Blocked checks" width="150px"/> | <img src="extras/readme-images/not-blocked.png" alt="No blocking" title="No blocking" width="150px"/> |

## Description

Use this field plug-in when you would like to time multiple *select_one* and/or *select_multiple* fields within the same [field list](https://docs.surveycto.com/02-designing-forms/04-sample-forms/05.field-lists.html). This will have a persistent timer at the top, even if the enumerator/respondent scrolls down.

To learn all about how to use this field plug-in, check out the [wiki](https://github.com/surveycto/timed-field-list/wiki/Timed-field-list-wiki), which goes into full detail on all of the features, parameters, and how to retrieve its data.

For just timing a single *select_one* or *select_multiple* field on a screen, see our [timed-choice](https://github.com/surveycto/timed-choice) field plug-in.

[![Download now](extras/readme-images/download-button.png)](https://github.com/surveycto/timed-field-list/raw/master/timed-field-list.fieldplugin.zip)

## Default SurveyCTO feature support

| Feature / Property | Support |
| --- | --- |
| Supported field type(s) | `select_one`, `select_multiple`|
| Default values | No |
| Custom constraint message | No |
| Custom required message | No |
| Read only | Yes |
| media:image | Yes |
| media:audio | Yes |
| media:video | Yes |
| `label` appearance | No |
| `list-nolabel` appearance | No |
| `quick` appearance | No |
| `minimal` appearance | No |
| `compact` appearance | No |
| `compact-#` appearance | No |
| `quickcompact` appearance | No |
| `quickcompact-#` appearance | No |
| `likert` appearance | No |
| `likert-min` appearance | No  |
| `likert-mid` appearance | No |

## How to use

**To use this field plug-in as-is**, just download the [timed-field-list.fieldplugin.zip](https://github.com/surveycto/timed-field-list/raw/master/timed-field-list.fieldplugin.zip) file from this repo, and attach it to your form.

**To use with the sample form:**

1. Download the [sample form](extras/sample-form) from this repo and upload it to your SurveyCTO server.
1. Download the [timed-field-list.fieldplugin.zip](https://github.com/surveycto/timed-field-list/raw/master/timed-field-list.fieldplugin.zip) file from this repo, and attach it to the sample form on your SurveyCTO server.
1. Adjust the parameters as you see fit.

## Parameters
See the [wiki]() for details about all of the parameters and how to use them.

## More resources

* **Sample form**  
You can find a form definition in this repo here: [extras/sample-form](extras/sample-form).

* **Developer documentation**  
More instructions for developing and using field plug-ins can be found here: [https://github.com/surveycto/Field-plug-in-resources](https://github.com/surveycto/Field-plug-in-resources)
