# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-10-31 19:50
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0005_auto_20171031_1937'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='transaction',
            unique_together=set([('accountfk', 'trxid')]),
        ),
    ]