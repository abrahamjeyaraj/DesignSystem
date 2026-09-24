# Pen native component spec (extracted from TuitionManager/ux/tuition-manager.pen)

`$name` = Pen variable (see tokens/themes/tuition.json mapping). Sizes in pt/dp.

## M / Status Bar
```json
{"type":"frame","name":"M / Status Bar","width":390,"height":54,"padding":[0,28],"alignItems":"center","justifyContent":"space_between","children":[{"type":"text","name":"Time","fill":"$text-primary","fontSize":16,"fontWeight":"600","fontFamily":"$font-body","content":"9:41"},{"type":"frame","name":"Indicators","gap":6,"alignItems":"center","children":[{"type":"icon","name":"signal","width":17,"height":17,"fill":"$text-primary"},{"type":"icon","name":"wifi","width":17,"height":17,"fill":"$text-primary"},{"type":"icon","name":"battery-full","width":17,"height":17,"fill":"$text-primary"}]}]}
```

## M / Tab Item / Active
```json
{"type":"frame","name":"M / Tab Item / Active","width":76,"fill":"#8A2B2B1A","cornerRadius":999,"padding":[6,14],"gap":3,"layout":"vertical","alignItems":"center","justifyContent":"center","children":[{"type":"icon","name":"Icon","width":22,"height":22,"fill":"$accent"},{"type":"text","name":"Label","fill":"$accent","fontSize":10.5,"fontWeight":"600","fontFamily":"$font-body","content":"Today"}]}
```

## M / Tab Item / Rest
```json
{"type":"frame","name":"M / Tab Item / Rest","width":76,"cornerRadius":999,"padding":[6,14],"gap":3,"layout":"vertical","alignItems":"center","justifyContent":"center","children":[{"type":"icon","name":"Icon","width":22,"height":22,"fill":"$text-muted"},{"type":"text","name":"Label","fill":"$text-muted","fontSize":10.5,"fontWeight":"500","fontFamily":"$font-body","content":"Students"}]}
```

## M / Tab Bar
```json
{"type":"frame","name":"M / Tab Bar","width":390,"padding":[0,16,12,16],"children":[{"type":"frame","name":"Capsule","width":"fill_container","height":64,"fill":"#FFFFFFE6","cornerRadius":32,"padding":6,"alignItems":"center","justifyContent":"space_between","stroke":"$border","strokeWidth":1,"effect":{"type":"shadow","shadowType":"outer","color":"#2A211D1F","offset":{"x":0,"y":8},"blur":24},"children":[{"type":"ref","name":"Tab Today","width":68,"ref":"G7a2WE"},{"type":"ref","name":"Tab Students","width":68,"ref":"dJKN8"},{"type":"ref","name":"Tab Fees","width":68,"ref":"dJKN8"},{"type":"ref","name":"Tab Classes","width":68,"ref":"dJKN8"},{"type":"ref","name":"Tab More","width":68,"ref":"dJKN8"}]}]}
```

## M / Button / Primary
```json
{"type":"frame","name":"M / Button / Primary","height":48,"fill":"$accent","cornerRadius":999,"padding":[0,22],"gap":8,"alignItems":"center","justifyContent":"center","children":[{"type":"icon","name":"Icon","width":18,"height":18,"fill":"$on-accent"},{"type":"text","name":"Label","fill":"$on-accent","fontSize":"$m-body","fontWeight":"600","fontFamily":"$font-body","content":"Record payment"}]}
```

## M / Button / Secondary
```json
{"type":"frame","name":"M / Button / Secondary","height":48,"fill":"$surface-card","cornerRadius":999,"padding":[0,22],"gap":8,"alignItems":"center","justifyContent":"center","stroke":"$border","strokeWidth":1,"children":[{"type":"icon","name":"Icon","width":18,"height":18,"fill":"$text-primary"},{"type":"text","name":"Label","fill":"$text-primary","fontSize":"$m-body","fontWeight":"600","fontFamily":"$font-body","content":"Remind"}]}
```

## M / Icon Button
```json
{"type":"frame","name":"M / Icon Button","width":44,"height":44,"fill":"$surface-card","cornerRadius":999,"alignItems":"center","justifyContent":"center","stroke":"$border","strokeWidth":1,"children":[{"type":"icon","name":"Icon","width":20,"height":20,"fill":"$text-primary"}]}
```

## M / Chip / Paid
```json
{"type":"frame","name":"M / Chip / Paid","fill":"#E3ECDF","cornerRadius":999,"padding":[4,10],"alignItems":"center","children":[{"type":"text","name":"Label","fill":"#3F6B3A","fontSize":12,"fontWeight":"600","fontFamily":"$font-body","content":"Paid"}]}
```

## M / Chip / Due
```json
{"type":"frame","name":"M / Chip / Due","fill":"$warn-bg","cornerRadius":999,"padding":[4,10],"alignItems":"center","children":[{"type":"text","name":"Label","fill":"$warn","fontSize":12,"fontWeight":"600","fontFamily":"$font-body","content":"Due"}]}
```

## M / Chip / Overdue
```json
{"type":"frame","name":"M / Chip / Overdue","fill":"$alert-bg","cornerRadius":999,"padding":[4,10],"alignItems":"center","children":[{"type":"text","name":"Label","fill":"$alert","fontSize":12,"fontWeight":"600","fontFamily":"$font-body","content":"Overdue"}]}
```

## M / Chip / Neutral
```json
{"type":"frame","name":"M / Chip / Neutral","fill":"$surface-sand","cornerRadius":999,"padding":[4,10],"alignItems":"center","children":[{"type":"text","name":"Label","fill":"$text-secondary","fontSize":12,"fontWeight":"600","fontFamily":"$font-body","content":"Class 10"}]}
```

## M / Avatar
```json
{"type":"frame","name":"M / Avatar","width":40,"height":40,"fill":"$surface-tint","cornerRadius":999,"alignItems":"center","justifyContent":"center","children":[{"type":"text","name":"Initials","fill":"$accent","fontSize":14,"fontWeight":"600","fontFamily":"$font-body","content":"AR"}]}
```

## M / List Row
```json
{"type":"frame","name":"M / List Row","width":390,"fill":"$surface-card","padding":[12,16],"gap":12,"alignItems":"center","children":[{"type":"ref","name":"Avatar","ref":"J4DVR"},{"type":"frame","name":"Text","width":"fill_container","gap":2,"layout":"vertical","children":[{"type":"text","name":"Title","fill":"$text-primary","fontSize":"$m-body","fontWeight":"600","fontFamily":"$font-body","content":"Ananya Raghavan"},{"type":"text","name":"Subtitle","fill":"$text-muted","fontSize":"$m-label","fontWeight":"normal","fontFamily":"$font-body","content":"Class 10 \u00b7 Maths, Physics"}]},{"type":"ref","name":"Trailing","ref":"Xg5Ze"},{"type":"icon","name":"Chevron","width":18,"height":18,"fill":"$text-muted"}]}
```

## M / Stat Tile
```json
{"type":"frame","name":"M / Stat Tile","width":170,"fill":"$surface-card","cornerRadius":"$m-radius-card","padding":16,"gap":4,"layout":"vertical","stroke":"$border","strokeWidth":1,"children":[{"type":"text","name":"Label","fill":"$text-muted","fontSize":"$m-label","fontWeight":"normal","fontFamily":"$font-body","content":"Collected"},{"type":"text","name":"Value","fill":"$text-primary","fontSize":24,"fontWeight":"500","fontFamily":"$font-head","content":"\u20b93,84,000"},{"type":"text","name":"Meta","fill":"#3F6B3A","fontSize":12,"fontWeight":"500","fontFamily":"$font-body","content":"+12% vs Aug"}]}
```

## M / Segmented
```json
{"type":"frame","name":"M / Segmented","width":390,"fill":"$surface-sand","cornerRadius":999,"padding":4,"children":[{"type":"frame","name":"Seg All","width":"fill_container","height":36,"fill":"$surface-card","cornerRadius":999,"alignItems":"center","justifyContent":"center","effect":{"type":"shadow","shadowType":"outer","color":"#2A211D22","offset":{"x":0,"y":1},"blur":3},"children":[{"type":"text","name":"Label","fill":"$text-primary","fontSize":"$m-label","fontWeight":"600","fontFamily":"$font-body","content":"All"}]},{"type":"frame","name":"Seg Due","width":"fill_container","height":36,"cornerRadius":999,"alignItems":"center","justifyContent":"center","children":[{"type":"text","name":"Label","fill":"$text-secondary","fontSize":"$m-label","fontWeight":"500","fontFamily":"$font-body","content":"Due"}]},{"type":"frame","name":"Seg Overdue","width":"fill_container","height":36,"cornerRadius":999,"alignItems":"center","justifyContent":"center","children":[{"type":"text","name":"Label","fill":"$text-secondary","fontSize":"$m-label","fontWeight":"500","fontFamily":"$font-body","content":"Overdue"}]},{"type":"frame","name":"Seg Paid","width":"fill_container","height":36,"cornerRadius":999,"alignItems":"center","justifyContent":"center","children":[{"type":"text","name":"Label","fill":"$text-secondary","fontSize":"$m-label","fontWeight":"500","fontFamily":"$font-body","content":"Paid"}]}]}
```

## M / Field
```json
{"type":"frame","name":"M / Field","width":390,"gap":6,"layout":"vertical","children":[{"type":"text","name":"Label","fill":"$text-secondary","fontSize":"$m-label","fontWeight":"500","fontFamily":"$font-body","content":"Amount"},{"type":"frame","name":"Box","width":"fill_container","height":52,"fill":"$surface-card","cornerRadius":12,"padding":[0,16],"alignItems":"center","stroke":"$border","strokeWidth":1,"children":[{"type":"text","name":"Value","fill":"$text-primary","fontSize":16,"fontWeight":"normal","fontFamily":"$font-body","content":"\u20b912,000"}]}]}
```

## M / Search
```json
{"type":"frame","name":"M / Search","width":390,"height":44,"fill":"$surface-sand","cornerRadius":999,"padding":[0,14],"gap":8,"alignItems":"center","children":[{"type":"icon","name":"Icon","width":18,"height":18,"fill":"$text-muted"},{"type":"text","name":"Placeholder","fill":"$text-muted","fontSize":"$m-body","fontWeight":"normal","fontFamily":"$font-body","content":"Search students"}]}
```

## M / Large Title
```json
{"type":"frame","name":"M / Large Title","width":390,"padding":[8,20,4,20],"gap":4,"layout":"vertical","children":[{"type":"text","name":"Eyebrow","fill":"$text-muted","fontSize":"$m-label","fontWeight":"500","fontFamily":"$font-body","content":"Friday, 19 September"},{"type":"frame","name":"Row","width":"fill_container","alignItems":"center","justifyContent":"space_between","children":[{"type":"text","name":"Title","fill":"$text-primary","fontSize":"$m-title","fontWeight":"500","fontFamily":"$font-head","content":"Today"},{"type":"ref","name":"Action","ref":"PPOXG"}]}]}
```

## M / Nav Bar
```json
{"type":"frame","name":"M / Nav Bar","width":390,"height":52,"padding":[0,12],"alignItems":"center","justifyContent":"space_between","children":[{"type":"ref","name":"Back","ref":"PPOXG"},{"type":"text","name":"Title","fill":"$text-primary","fontSize":16,"fontWeight":"600","fontFamily":"$font-body","content":"Student"},{"type":"ref","name":"More","ref":"PPOXG"}]}
```

## M / Sheet Handle
```json
{"type":"frame","name":"M / Sheet Handle","width":390,"height":20,"alignItems":"center","justifyContent":"center","children":[{"type":"rectangle","name":"Grabber","width":40,"height":5,"fill":"$border","cornerRadius":3}]}
```

## M / Section Header
```json
{"type":"frame","name":"M / Section Header","width":390,"padding":[0,20],"alignItems":"end","justifyContent":"space_between","children":[{"type":"text","name":"Title","fill":"$text-primary","fontSize":17,"fontWeight":"600","fontFamily":"$font-body","content":"Classes today"},{"type":"text","name":"Action","fill":"$accent","fontSize":"$m-label","fontWeight":"600","fontFamily":"$font-body","content":"See all"}]}
```
