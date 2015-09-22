#!/usr/bin/env python
# encoding: utf-8
"""
Copyright (c) 2015 PushingKarma. All rights reserved.
"""
import gfm
from collections import defaultdict
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.db import models
from django.db.models import signals
from django_extensions.db.models import TimeStampedModel


class Note(TimeStampedModel):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    body = models.TextField()
    tags = models.CharField(max_length=255, blank=True, help_text='space delimited')
    authors = models.CharField(max_length=255, default='Michael Shepanski', help_text='comma delimited')
    allow_comments = models.BooleanField(default=True)

    class Meta:
        ordering = ('-created',)
        get_latest_by = 'created'

    def url(self):
        return reverse('note', kwargs={'slug':self.slug})

    def tags(self):
        return sorted(self.tags.split())

    def html(self, anchor=True):
        return gfm.gfm(self.body, safe_mode=False)

    @classmethod
    def all_tags(cls):
        tags = cache.get('note_tags')
        if tags is None:
            return cls.update_tag_cache()
        return tags

    @classmethod
    def update_tag_cache(cls, **kwargs):
        tags = defaultdict(int)
        for tagstr in Note.objects.values_list('tags', flat=True):
            for tag in filter(bool, tagstr.split(' ')):
                tag = tag.lower().strip()
                tags[tag] += 1
        cache.set('note_tags', dict(tags), 999999999)
        return dict(tags)


class Page(TimeStampedModel):
    slug = models.CharField(max_length=255, unique=True)
    body = models.TextField()
    allow_comments = models.BooleanField(default=True)

    def url(self):
        return reverse('page', kwargs={'slug':self.slug})

    def html(self, anchor=True):
        return gfm.gfm(self.body, safe_mode=False)


signals.post_save.connect(Note.update_tag_cache, sender=Note)
signals.post_delete.connect(Note.update_tag_cache, sender=Note)