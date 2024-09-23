+++
title = ''
subtitle = ''
date = {{ .Date }}
slug = '{{ .File.ContentBaseName }}'
draft = false
number = '{{ len (where .Site.RegularPages "Section" "==" .Section) | add 1 }}'
edition = 'die meinung'
categories = []
+++
