#!/bin/bash
echo "publish running"
rm -rf ~/node_modules_tmp/local/gatsby-source-prismic-graphql/*
echo "removed stuff"
cp -r ./components ~/node_modules_tmp/local/gatsby-source-prismic-graphql
cp -r ./interfaces ~/node_modules_tmp/local/gatsby-source-prismic-graphql
cp -r ./types ~/node_modules_tmp/local/gatsby-source-prismic-graphql
cp -r ./utils ~/node_modules_tmp/local/gatsby-source-prismic-graphql
cp *.js ~/node_modules_tmp/local/gatsby-source-prismic-graphql
cp ./package.json ~/node_modules_tmp/local/gatsby-source-prismic-graphql
cp -r ~/node_modules_tmp/gatsby-source-prismic-graphql/node_modules ~/node_modules_tmp/local/gatsby-source-prismic-graphql
echo "copied things to tmp"
rm -rf ~/reserve/plugins/custom-gatsby-source-prismic-graphql
cp -r ~/node_modules_tmp/local/gatsby-source-prismic-graphql/ ~/reserve/plugins/custom-gatsby-source-prismic-graphql
echo "finished"