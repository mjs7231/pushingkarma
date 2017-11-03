# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2017-10-31 19:35
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django_extensions.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0003_auto_20171016_0353'),
    ]

    operations = [
        migrations.CreateModel(
            name='Account',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created', django_extensions.db.fields.CreationDateTimeField(auto_now_add=True, verbose_name='created')),
                ('modified', django_extensions.db.fields.ModificationDateTimeField(auto_now=True, verbose_name='modified')),
                ('name', models.CharField(db_index=True, max_length=255)),
                ('fid', models.IntegerField(db_index=True, unique=True)),
                ('type', models.CharField(choices=[('bank', 'Bank'), ('credit', 'Credit')], max_length=255)),
                ('payee', models.CharField(blank=True, default='', max_length=255)),
                ('balance', models.DecimalField(decimal_places=2, default=None, max_digits=9, null=True)),
                ('balancedt', models.DateTimeField(default=None, null=True)),
            ],
            options={
                'ordering': ('-modified', '-created'),
                'get_latest_by': 'modified',
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='transaction',
            name='accountfk',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, to='budget.Account'),
            preserve_default=False,
        ),
    ]