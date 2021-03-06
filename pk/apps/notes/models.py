# encoding: utf-8
from django.conf import settings
from django.db import models
from django.template.defaultfilters import slugify
from django_extensions.db.models import TimeStampedModel


class Note(TimeStampedModel):
    slug = models.SlugField(max_length=255, unique=True, default=None)
    title = models.CharField(max_length=255)
    body = models.TextField(help_text='markdown format')
    tags = models.CharField(max_length=255, blank=True, help_text='space delimited')

    def __str__(self):
        return self.slug

    def weburl(self):
        return f'{settings.DOMAIN}/notes?id={self.id}'

    def save(self, *args, **kwargs):
        self.slug = slugify(self.title)
        super(Note, self).save(*args, **kwargs)
