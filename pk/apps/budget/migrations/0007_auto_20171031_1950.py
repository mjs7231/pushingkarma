# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-10-31 19:50
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0006_auto_20171031_1950'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='transaction',
            name='account',
        ),
        migrations.RemoveField(
            model_name='transaction',
            name='accountfid',
        ),
    ]
